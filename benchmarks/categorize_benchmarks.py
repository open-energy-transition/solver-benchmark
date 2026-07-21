#!/usr/bin/env python3
"""
Download, analyze benchmark problems, and update benchmark metadata.

The script scans metadata YAML files under a benchmark folder, downloads
benchmark problem files from their URLs, analyzes them using HiGHS
(highspy), and updates the corresponding YAML entries with model statistics,
a size category, problem class, and integer-variable share. Continuous and
integer variable counts are computed for every problem, LP or MILP: an LP
trivially has num_continuous_variables == num_variables and
num_integer_variables == 0.

Design goals:
- Modular functions with single responsibilities.
- Type hints everywhere to support static analysis.
- NumPy-style docstrings for public functions.
"""

from __future__ import annotations

import argparse
import gzip
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Optional
from urllib.parse import urlparse

import highspy
import requests
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap

# Metadata entries are always loaded via ruamel.yaml's round-trip loader, which
# returns CommentedMap (not a plain dict). CommentedMap supports ordered
# `.insert()`, which update_problem_entry relies on to keep YAML key
# ordering stable and readable.
YamlMap = CommentedMap


@dataclass(frozen=True)
class ModelStats:
    """Container for model statistics extracted from HiGHS."""

    num_constraints: int
    num_variables: int
    num_nonzeros: int
    num_continuous_variables: int
    num_integer_variables: int
    size_category: str
    problem_class: str
    share_integer_variables: float


@dataclass
class ProcessingSummary:
    """Counters for tracking progress and failures."""

    total_files: int = 0
    successful_downloads: int = 0
    successful_analyses: int = 0
    successful_updates: int = 0
    failed_tasks: int = 0


def determine_size_category(num_variables: int) -> str:
    """
    Determine a size category based on the number of variables.

    Parameters
    ----------
    num_variables : int
        Number of variables in the model.

    Returns
    -------
    str
        Size category ("S", "M", or "L").
    """
    if num_variables < 10_000:
        return "S"
    if num_variables < 1_000_000:
        return "M"
    return "L"


def create_yaml() -> YAML:
    """
    Create a configured YAML loader/dumper.

    Returns
    -------
    ruamel.yaml.YAML
        YAML instance configured to preserve quotes and avoid wrapping.
    """
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = float("inf")
    return yaml


def iter_metadata_files(root: Path) -> Iterable[Path]:
    """
    Yield benchmark metadata YAML files under a directory.

    Parameters
    ----------
    root : Path
        Directory to search recursively for metadata YAML files.

    Yields
    ------
    Path
        Metadata file paths matching "[Mm]etadata*.yaml", excluding the
        schema definition and template files.
    """
    excluded = {
        "metadata_schema.yaml",
        "_template_metadata.yaml",
    }

    for path in sorted(root.rglob("[Mm]etadata*.yaml")):
        if path.name in excluded:
            continue
        yield path


def read_text_file(path: Path) -> str:
    """
    Read a UTF-8 text file.

    Parameters
    ----------
    path : Path
        Path to file.

    Returns
    -------
    str
        File contents.
    """
    return path.read_text(encoding="utf-8")


def write_yaml_file(path: Path, yaml_obj: YAML, data: Any) -> None:
    """
    Write YAML data to disk.

    Parameters
    ----------
    path : Path
        Destination path.
    yaml_obj : ruamel.yaml.YAML
        YAML instance used to dump data.
    data : Any
        YAML-serializable object.
    """
    with open(path, "w", encoding="utf-8") as f:
        yaml_obj.dump(data, f)


def is_http_url(url: str) -> bool:
    """
    Check whether a URL is an HTTP(S) URL.

    Parameters
    ----------
    url : str
        Candidate URL string.

    Returns
    -------
    bool
        True if the URL looks like HTTP(S).
    """
    if not url:
        return False
    u = url.strip().lower()
    return u.startswith("http://") or u.startswith("https://")


def get_extension(url_path: str) -> str:
    """
    Return a recognized extension from a URL path.

    Parameters
    ----------
    url_path : str
        URL path component.

    Returns
    -------
    str
        Extension token: "lp", "lp.gz", "mps", or "mps.gz".

    Raises
    ------
    ValueError
        If the URL path does not end with a supported extension.
    """
    known = {
        ".lp.gz": "lp.gz",
        ".mps.gz": "mps.gz",
        ".lp": "lp",
        ".mps": "mps",
    }
    for suffix, token in known.items():
        if url_path.endswith(suffix):
            return token
    raise ValueError(f"Unknown URL extension {url_path}")


def download_stream_to_file(url: str, dest: Path, timeout_s: int = 60) -> None:
    """
    Download a URL to a local file path.

    Parameters
    ----------
    url : str
        Source URL.
    dest : Path
        Destination file path.
    timeout_s : int, optional
        Request timeout in seconds. Default is 60.

    Notes
    -----
    A timeout is used to avoid hanging CI/HPC jobs indefinitely.
    """
    response = requests.get(url, stream=True, timeout=timeout_s)
    response.raise_for_status()

    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)


def decompress_gzip_file(
    compressed_path: Path,
    output_path: Path,
) -> None:
    """
    Decompress a gzip file to an output path.

    Parameters
    ----------
    compressed_path : Path
        Path to `.gz` file.
    output_path : Path
        Destination path for decompressed bytes.
    """
    with gzip.open(compressed_path, "rb") as gz_file:
        with open(output_path, "wb") as out:
            out.write(gz_file.read())


def get_cached_paths(
    url: str,
    cache_dir: Path,
) -> tuple[Path, Optional[Path]]:
    """
    Compute cache paths for a URL.

    Parameters
    ----------
    url : str
        Source URL.
    cache_dir : Path
        Cache directory.

    Returns
    -------
    tuple[Path, Optional[Path]]
        (download_target, uncompressed_target_or_None)
    """
    parsed = urlparse(url)
    filename = Path(parsed.path).name
    extension = get_extension(parsed.path)

    download_target = cache_dir / filename

    if extension.endswith(".gz"):
        # For "foo.mps.gz", ruamel's with_suffix would drop only ".gz".
        # We prefer "foo.mps" / "foo.lp" explicitly.
        if extension == "mps.gz":
            uncompressed = cache_dir / filename.removesuffix(".gz")
        elif extension == "lp.gz":
            uncompressed = cache_dir / filename.removesuffix(".gz")
        else:
            raise ValueError(f"Unsupported gz extension: {extension}")
        return download_target, uncompressed

    return download_target, None


def download_benchmark_file(
    url: str,
    use_cache: bool,
    cache_dir: Optional[Path] = None,
) -> Optional[Path]:
    """
    Download a benchmark problem file and return its local path.

    Parameters
    ----------
    url : str
        Model URL (HTTP/S).
    use_cache : bool
        If True, downloads are stored in `cache_dir` and reused.
    cache_dir : Path, optional
        Cache directory when `use_cache=True`.

    Returns
    -------
    Path or None
        Local path to the decompressed model file, or None on failure.
    """
    try:
        if not is_http_url(url):
            raise ValueError(f"Invalid URL: {url}")

        parsed = urlparse(url)
        extension = get_extension(parsed.path)

        if use_cache:
            if cache_dir is None:
                raise ValueError("cache_dir must be set when use_cache=True")
            cache_dir.mkdir(parents=True, exist_ok=True)

            download_path, uncompressed_path = get_cached_paths(url, cache_dir)

            # Reuse already decompressed file to avoid repeated work.
            if uncompressed_path is not None and uncompressed_path.exists():
                return uncompressed_path

            if uncompressed_path is None and download_path.exists():
                return download_path

            print(f"Downloading {url}")
            download_stream_to_file(url, download_path)

            if extension.endswith(".gz"):
                assert uncompressed_path is not None
                decompress_gzip_file(download_path, uncompressed_path)
                download_path.unlink(missing_ok=True)
                return uncompressed_path

            return download_path

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}")
        tmp_path = Path(tmp.name)
        tmp.close()
        print(f"Downloading {url}")
        download_stream_to_file(url, tmp_path)

        if not extension.endswith(".gz"):
            return tmp_path

        if extension == "lp.gz":
            suffix = ".lp"
        elif extension == "mps.gz":
            suffix = ".mps"
        else:
            raise ValueError(f"Unsupported gz extension: {extension}")

        out_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        out_path = Path(out_tmp.name)
        out_tmp.close()

        decompress_gzip_file(tmp_path, out_path)
        tmp_path.unlink(missing_ok=True)

        return out_path

    except Exception as exc:
        print(f"Error processing {url}: {exc}", file=sys.stderr)
        return None


def safe_unlink(path: Optional[Path]) -> None:
    """
    Remove a file path if it exists.

    Parameters
    ----------
    path : Path, optional
        Path to remove.
    """
    if path is None:
        return
    try:
        path.unlink(missing_ok=True)
    except Exception:
        # Best-effort cleanup only.
        return


def count_variable_types(highs: highspy.Highs, num_variables: int) -> tuple[int, int]:
    """
    Count continuous and integer variables in a HiGHS model.

    Parameters
    ----------
    highs : highspy.Highs
        HiGHS instance with a model loaded.
    num_variables : int
        Number of columns.

    Returns
    -------
    tuple[int, int]
        (num_continuous, num_integer)
    """
    num_cont, num_int = 0, 0
    for i in range(num_variables):
        var_type = highs.getColIntegrality(i)[1]
        if var_type == highspy.HighsVarType.kInteger:
            num_int += 1
        elif var_type == highspy.HighsVarType.kContinuous:
            num_cont += 1
    return num_cont, num_int


def analyze_model_file(file_path: Path) -> Optional[ModelStats]:
    """
    Analyze a model file using HiGHS and return statistics.

    Problem class, size category, and integer-variable share are all
    derived from the analyzed model rather than taken from the existing
    metadata, since they're calculated fields, not submitted ones.
    Continuous/integer variable counts are computed regardless of problem
    class: an LP trivially has num_continuous_variables == num_variables
    and num_integer_variables == 0.

    Parameters
    ----------
    file_path : Path
        Path to the model file (.lp or .mps).

    Returns
    -------
    ModelStats or None
        Parsed statistics, or None if analysis fails.
    """
    try:
        highs = highspy.Highs()
        highs.readModel(str(file_path))

        num_variables = highs.getNumCol()
        if num_variables == 0:
            raise RuntimeError("Model loaded but has zero variables")

        num_constraints = highs.getNumRow()

        try:
            num_nonzeros = highs.getNumNz()
        except AttributeError:
            num_nonzeros = highs.getNumNonzeros()

        num_cont, num_int = count_variable_types(highs, num_variables)

        stats = ModelStats(
            num_constraints=num_constraints,
            num_variables=num_variables,
            num_nonzeros=num_nonzeros,
            num_continuous_variables=num_cont,
            num_integer_variables=num_int,
            size_category=determine_size_category(num_variables),
            problem_class="MILP" if num_int > 0 else "LP",
            share_integer_variables=num_int / num_variables,
        )

        print(f"Analysis complete for {file_path}. Stats:\n  {stats}")
        return stats

    except Exception as exc:
        print(f"Error analyzing {file_path}: {exc}", file=sys.stderr)
        return None


def get_problem_identity(
    problem_id: str, problem_info: YamlMap
) -> Optional[tuple[str, str]]:
    """
    Extract (name, url) for a problem entry if available.

    Parameters
    ----------
    problem_id : str
        Problem ID key from the metadata mapping.
    problem_info : dict
        Problem metadata entry.

    Returns
    -------
    tuple[str, str] or None
        (problem_id, url) if a valid HTTP(S) URL is present.
    """
    url = problem_info.get("URL")

    if not isinstance(url, str) or not url.strip():
        return None
    if not is_http_url(url):
        return None

    return problem_id, url.strip()


# Fields considered "calculated"; a problem is skipped (not re-analyzed) once
# all of these are already present and valid.
CALCULATED_STAT_FIELDS = [
    "Num. constraints",
    "Num. variables",
    "Num. nonzeros",
    "Num. continuous variables",
    "Num. integer variables",
    "Problem class",
    "Share integer variables",
]


def stats_are_complete_and_valid(problem_info: YamlMap) -> bool:
    """
    Check whether a problem entry already has complete, valid statistics.

    Parameters
    ----------
    problem_info : dict
        Problem metadata entry.

    Returns
    -------
    bool
        True if all calculated fields exist and the counts are positive.
    """
    for field in CALCULATED_STAT_FIELDS:
        if problem_info.get(field) is None:
            return False

    try:
        return (
            int(problem_info.get("Num. variables", 0)) > 0
            and int(problem_info.get("Num. constraints", 0)) > 0
            and int(problem_info.get("Num. nonzeros", 0)) > 0
        )
    except Exception:
        return False


def update_problem_entry(problem_info: YamlMap, stats: ModelStats) -> None:
    """
    Update a problem entry in-place with model statistics.

    Parameters
    ----------
    problem_info : dict
        Problem metadata entry to update.
    stats : ModelStats
        Statistics extracted from the model.

    Notes
    -----
    We insert "Num. nonzeros" immediately after "Num. variables" when
    the key does not exist, to keep YAML ordering stable and readable.
    """
    problem_info["Problem class"] = stats.problem_class
    problem_info["Size"] = stats.size_category
    problem_info["Num. constraints"] = stats.num_constraints
    problem_info["Num. variables"] = stats.num_variables

    if "Num. nonzeros" in problem_info:
        problem_info["Num. nonzeros"] = stats.num_nonzeros
    else:
        keys = list(problem_info.keys())
        try:
            insert_index = keys.index("Num. variables") + 1
        except ValueError:
            insert_index = len(keys)
        problem_info.insert(insert_index, "Num. nonzeros", stats.num_nonzeros)

    problem_info["Num. continuous variables"] = stats.num_continuous_variables
    problem_info["Num. integer variables"] = stats.num_integer_variables
    problem_info["Share integer variables"] = stats.share_integer_variables


def update_problem_in_yaml(
    yaml_data: YamlMap,
    problem_id: str,
    stats: ModelStats,
) -> bool:
    """
    Update the matching problem entry in the YAML structure.

    Parameters
    ----------
    yaml_data : dict
        Parsed YAML root.
    problem_id : str
        Problem ID key to update.
    stats : ModelStats
        Statistics extracted from the model.

    Returns
    -------
    bool
        True if the entry was found and updated.
    """
    problems = yaml_data.get("problems")
    if not isinstance(problems, dict):
        return False

    problem_info = problems.get(problem_id)
    if not isinstance(problem_info, dict):
        return False

    update_problem_entry(problem_info, stats)
    return True


def process_problem_entry(
    yaml_data: YamlMap,
    file_path: Path,
    problem_id: str,
    problem_info: YamlMap,
    use_cache: bool,
    cache_dir: Path,
    yaml_obj: YAML,
    summary: ProcessingSummary,
) -> None:
    """
    Process a single problem entry (download, analyze, update, write-back).

    Parameters
    ----------
    yaml_data : dict
        Parsed YAML root.
    file_path : Path
        Source metadata YAML file.
    problem_id : str
        Problem ID key.
    problem_info : dict
        Problem metadata entry.
    use_cache : bool
        Whether to cache downloads.
    cache_dir : Path
        Cache directory for downloads.
    yaml_obj : ruamel.yaml.YAML
        YAML dumper used for writing back.
    summary : ProcessingSummary
        Counters updated in-place.
    """
    identity = get_problem_identity(problem_id, problem_info)
    if identity is None:
        return

    _, url = identity
    summary.total_files += 1

    if stats_are_complete_and_valid(problem_info):
        # We skip analysis to keep runs fast when YAML is already filled.
        return

    model_path = download_benchmark_file(
        url,
        use_cache=use_cache,
        cache_dir=cache_dir if use_cache else None,
    )
    if model_path is None:
        summary.failed_tasks += 1
        return

    summary.successful_downloads += 1

    stats = analyze_model_file(model_path)

    if not use_cache:
        safe_unlink(model_path)

    if stats is None:
        summary.failed_tasks += 1
        return

    summary.successful_analyses += 1

    updated = update_problem_in_yaml(yaml_data, problem_id, stats)
    if not updated:
        summary.failed_tasks += 1
        return

    summary.successful_updates += 1
    write_yaml_file(file_path, yaml_obj, yaml_data)
    print(f"Updated {problem_id} with model stats")


def process_metadata_file(
    file_path: Path,
    use_cache: bool,
    cache_dir: Path,
    yaml_obj: YAML,
    summary: ProcessingSummary,
) -> None:
    """
    Process a single metadata YAML file.

    Parameters
    ----------
    file_path : Path
        Path to a metadata YAML file.
    use_cache : bool
        Whether to cache downloads.
    cache_dir : Path
        Cache directory for downloads.
    yaml_obj : ruamel.yaml.YAML
        YAML loader/dumper.
    summary : ProcessingSummary
        Counters updated in-place.
    """
    if file_path.stat().st_size == 0:
        return

    content = read_text_file(file_path)
    if not content.strip():
        return

    yaml_data = yaml_obj.load(content)
    if not isinstance(yaml_data, dict):
        return

    problems = yaml_data.get("problems")
    if not isinstance(problems, dict):
        return

    for problem_id, problem_info in problems.items():
        if not isinstance(problem_info, dict):
            continue

        process_problem_entry(
            yaml_data=yaml_data,
            file_path=file_path,
            problem_id=str(problem_id),
            problem_info=problem_info,
            use_cache=use_cache,
            cache_dir=cache_dir,
            yaml_obj=yaml_obj,
            summary=summary,
        )


def process_metadata_files(
    benchmark_folder: str,
    output_folder: str,
    use_cache: bool,
) -> ProcessingSummary:
    """
    Process all metadata YAML files under a benchmark directory.

    Parameters
    ----------
    benchmark_folder : str
        Path to benchmark folder that contains metadata YAML files.
    output_folder : str
        Directory used for cached downloads when cache is enabled.
    use_cache : bool
        If True, downloads are cached under `output_folder`.

    Returns
    -------
    ProcessingSummary
        Summary counters.
    """
    benchmarks_dir = Path(benchmark_folder)
    cache_dir = Path(output_folder)

    yaml_obj = create_yaml()
    summary = ProcessingSummary()

    for file_path in iter_metadata_files(benchmarks_dir):
        try:
            process_metadata_file(
                file_path=file_path,
                use_cache=use_cache,
                cache_dir=cache_dir,
                yaml_obj=yaml_obj,
                summary=summary,
            )
        except Exception as exc:
            print(f"Error processing {file_path}: {exc}", file=sys.stderr)
            summary.failed_tasks += 1

    return summary


def print_summary(summary: ProcessingSummary) -> None:
    """
    Print a processing summary.

    Parameters
    ----------
    summary : ProcessingSummary
        Summary counters.
    """
    print("\nProcessing Summary:")
    print(f"Total files found: {summary.total_files}")
    print(f"Successfully downloaded: {summary.successful_downloads}")
    print(f"Successfully analyzed: {summary.successful_analyses}")
    print(f"Successfully updated: {summary.successful_updates}")
    print(f"Failed tasks: {summary.failed_tasks}")


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    """
    Parse CLI arguments.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments. Defaults to sys.argv parsing.

    Returns
    -------
    argparse.Namespace
        Parsed args.
    """
    parser = argparse.ArgumentParser(
        description="Download, analyze benchmark problems, and update metadata.",
    )
    parser.add_argument(
        "--folder",
        type=str,
        default="./benchmarks",
        help="Path to the benchmark folder (default: ./benchmarks)",
    )
    parser.add_argument(
        "--output_folder",
        type=str,
        default="./runner/benchmarks",
        help=(
            "Path for cached LP/MPS files when caching is enabled "
            "(default: ./runner/benchmarks)"
        ),
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Download to temporary storage instead of using cache dir",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    """
    CLI entry point.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments.

    Returns
    -------
    int
        Exit code.
    """
    args = parse_args(argv)

    summary = process_metadata_files(
        benchmark_folder=args.folder,
        output_folder=args.output_folder,
        use_cache=not args.no_cache,
    )
    print_summary(summary)

    # Return non-zero if there were any failed tasks to make CI strict.
    return 0 if summary.failed_tasks == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Download, analyze benchmark models, and update benchmark metadata.

The script scans metadata YAML files under a benchmark folder, downloads
benchmark models from URLs, analyzes them using HiGHS (highspy), and
updates the corresponding YAML entries with model statistics and a size
category.

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
from typing import Any, Iterable, MutableMapping, Optional
from urllib.parse import urlparse

import highspy
import requests
from ruamel.yaml import YAML

YamlMap = MutableMapping[str, Any]


@dataclass(frozen=True)
class ModelStats:
    """Container for model statistics extracted from HiGHS."""

    num_constraints: int
    num_variables: int
    num_nonzeros: int
    size_category: str
    num_continuous_variables: Optional[int] = None
    num_integer_variables: Optional[int] = None


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
    Yield metadata YAML files under a directory.

    Parameters
    ----------
    root : Path
        Root directory to scan.

    Yields
    ------
    Path
        Paths matching `[Mm]etadata*.yaml`.
    """
    yield from sorted(root.rglob("[Mm]etadata*.yaml"))


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
    Download a benchmark model file and return its local path.

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


def analyze_model_file(file_path: Path, is_milp: bool) -> Optional[ModelStats]:
    """
    Analyze a model file using HiGHS and return statistics.

    Parameters
    ----------
    file_path : Path
        Path to the model file (.lp or .mps).
    is_milp : bool
        If True, additional integer/continuous counts are computed.

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

        size_category = determine_size_category(num_variables)

        if not is_milp:
            return ModelStats(
                num_constraints=num_constraints,
                num_variables=num_variables,
                num_nonzeros=num_nonzeros,
                size_category=size_category,
            )

        num_cont, num_int = count_variable_types(highs, num_variables)
        return ModelStats(
            num_constraints=num_constraints,
            num_variables=num_variables,
            num_nonzeros=num_nonzeros,
            size_category=size_category,
            num_continuous_variables=num_cont,
            num_integer_variables=num_int,
        )

    except Exception as exc:
        print(f"Error analyzing {file_path}: {exc}", file=sys.stderr)
        return None


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


def is_milp_problem_class(model_info: YamlMap) -> bool:
    """
    Check if model problem class indicates MILP.

    Parameters
    ----------
    model_info : dict
        Benchmark model metadata entry.

    Returns
    -------
    bool
        True if Problem class is "MILP".
    """
    return str(model_info.get("Problem class", "")).strip().upper() == "MILP"


def iter_size_entries(model_info: YamlMap) -> Iterable[YamlMap]:
    """
    Yield size entries from a model info entry.

    Parameters
    ----------
    model_info : dict
        Benchmark model metadata entry.

    Yields
    ------
    dict
        Size entry mappings.
    """
    sizes = model_info.get("Sizes", [])
    if not isinstance(sizes, list):
        return
    for entry in sizes:
        if isinstance(entry, dict):
            yield entry


def get_size_entry_identity(size_entry: YamlMap) -> Optional[tuple[str, str]]:
    """
    Extract (name, url) from a size entry if available.

    Parameters
    ----------
    size_entry : dict
        Size entry mapping.

    Returns
    -------
    tuple[str, str] or None
        (size_name, url) if present and valid.
    """
    name = size_entry.get("Name")
    url = size_entry.get("URL")

    if not isinstance(name, str) or not name.strip():
        return None
    if not isinstance(url, str) or not url.strip():
        return None
    if not is_http_url(url):
        return None

    return name.strip(), url.strip()


def required_stat_fields(is_milp: bool) -> list[str]:
    """
    Return the required metadata fields for considering stats complete.

    Parameters
    ----------
    is_milp : bool
        Whether MILP-specific fields are required.

    Returns
    -------
    list[str]
        Required field names.
    """
    fields = ["Num. constraints", "Num. variables", "Num. nonzeros"]
    if is_milp:
        fields.extend(
            ["Num. continuous variables", "Num. integer variables"],
        )
    return fields


def stats_are_complete_and_valid(size_entry: YamlMap, is_milp: bool) -> bool:
    """
    Check whether a size entry already has complete, valid statistics.

    Parameters
    ----------
    size_entry : dict
        Size entry mapping.
    is_milp : bool
        If True, MILP-specific fields are required.

    Returns
    -------
    bool
        True if fields exist and are positive.
    """
    fields = required_stat_fields(is_milp)

    for field in fields:
        if size_entry.get(field) is None:
            return False

    try:
        return (
            int(size_entry.get("Num. variables", 0)) > 0
            and int(size_entry.get("Num. constraints", 0)) > 0
            and int(size_entry.get("Num. nonzeros", 0)) > 0
        )
    except Exception:
        return False


def update_size_entry(size_entry: YamlMap, stats: ModelStats, is_milp: bool) -> None:
    """
    Update a size entry in-place with model statistics.

    Parameters
    ----------
    size_entry : dict
        Size entry mapping to update.
    stats : ModelStats
        Statistics extracted from the model.
    is_milp : bool
        Whether MILP fields should be written.

    Notes
    -----
    We insert "Num. nonzeros" immediately after "Num. variables" when
    the key does not exist, to keep YAML ordering stable and readable.
    """
    size_entry["Size"] = stats.size_category
    size_entry["Num. constraints"] = stats.num_constraints
    size_entry["Num. variables"] = stats.num_variables

    if "Num. nonzeros" in size_entry:
        size_entry["Num. nonzeros"] = stats.num_nonzeros
    else:
        keys = list(size_entry.keys())
        try:
            insert_index = keys.index("Num. variables") + 1
        except ValueError:
            insert_index = len(keys)
        size_entry.insert(insert_index, "Num. nonzeros", stats.num_nonzeros)

    if is_milp:
        size_entry["Num. continuous variables"] = stats.num_continuous_variables
        size_entry["Num. integer variables"] = stats.num_integer_variables


def update_size_in_yaml(
    yaml_data: YamlMap,
    model_name: str,
    size_name: str,
    stats: ModelStats,
) -> bool:
    """
    Update the matching size entry for a model in the YAML structure.

    Parameters
    ----------
    yaml_data : dict
        Parsed YAML root.
    model_name : str
        Benchmark model key.
    size_name : str
        Size entry name (e.g., "S", "M", "L", or custom).
    stats : ModelStats
        Statistics extracted from the model.

    Returns
    -------
    bool
        True if the entry was found and updated.
    """
    benchmarks = yaml_data.get("benchmarks")
    if not isinstance(benchmarks, dict):
        return False

    model_info = benchmarks.get(model_name)
    if not isinstance(model_info, dict):
        return False

    milp = is_milp_problem_class(model_info)

    for size_entry in iter_size_entries(model_info):
        if size_entry.get("Name") == size_name:
            update_size_entry(size_entry, stats, milp)
            return True

    return False


def process_size_entry(
    yaml_data: YamlMap,
    file_path: Path,
    model_name: str,
    model_info: YamlMap,
    size_entry: YamlMap,
    use_cache: bool,
    cache_dir: Path,
    yaml_obj: YAML,
    summary: ProcessingSummary,
) -> None:
    """
    Process a single size entry (download, analyze, update, write-back).

    Parameters
    ----------
    yaml_data : dict
        Parsed YAML root.
    file_path : Path
        Source metadata YAML file.
    model_name : str
        Benchmark model key.
    model_info : dict
        Benchmark model metadata entry.
    size_entry : dict
        Size entry mapping.
    use_cache : bool
        Whether to cache downloads.
    cache_dir : Path
        Cache directory for downloads.
    yaml_obj : ruamel.yaml.YAML
        YAML dumper used for writing back.
    summary : ProcessingSummary
        Counters updated in-place.
    """
    identity = get_size_entry_identity(size_entry)
    if identity is None:
        return

    size_name, url = identity
    summary.total_files += 1

    milp = is_milp_problem_class(model_info)

    if stats_are_complete_and_valid(size_entry, milp):
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

    stats = analyze_model_file(model_path, milp)

    if not use_cache:
        safe_unlink(model_path)

    if stats is None:
        summary.failed_tasks += 1
        return

    summary.successful_analyses += 1

    updated = update_size_in_yaml(yaml_data, model_name, size_name, stats)
    if not updated:
        summary.failed_tasks += 1
        return

    summary.successful_updates += 1
    write_yaml_file(file_path, yaml_obj, yaml_data)


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

    benchmarks = yaml_data.get("benchmarks")
    if not isinstance(benchmarks, dict):
        return

    for model_name, model_info in benchmarks.items():
        if model_info is None:
            continue
        if not isinstance(model_info, dict):
            continue

        for size_entry in iter_size_entries(model_info):
            process_size_entry(
                yaml_data=yaml_data,
                file_path=file_path,
                model_name=str(model_name),
                model_info=model_info,
                size_entry=size_entry,
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
        description="Download, analyze benchmark models, and update metadata.",
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

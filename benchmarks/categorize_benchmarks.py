#!/usr/bin/env python3
"""
Script to scan for metadata YAML files in benchmark folders,
download benchmark models from GCS URLs, analyze them with highspy,
and update Size values based on the number of variables and nonzeros.
"""

import argparse
import gzip
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import highspy
import requests
from ruamel.yaml import YAML


def determine_size_category(num_variables):
    """
    Determine the size category based on the number of variables.

    Args:
        num_variables (int): Number of variables in the model

    Returns:
        str: Size category (S, M, or L)
    """
    if num_variables < 1e4:
        return "S"
    elif num_variables < 1e6:
        return "M"
    else:
        return "L"


def analyze_model_file(file_path, is_milp: bool):
    """
    Analyze a model file using highspy to extract the number of variables constraints and nonzeros.

    Args:
        file_path (Path): Path to the model file

    Returns:
        dict: Dictionary containing model statistics or None if analysis failed
    """
    try:
        print(f"Analyzing model: {file_path}")
        highs = highspy.Highs()
        highs.readModel(str(file_path))

        # Extract key information
        num_variables = highs.getNumCol()
        if num_variables == 0:
            raise RuntimeError("Model loaded but has zero variables")

        num_constraints = highs.getNumRow()

        try:
            num_nonzeros = highs.getNumNz()
        except AttributeError:
            num_nonzeros = highs.getNumNonzeros()

        size_category = determine_size_category(num_variables)

        model_stats = {
            "num_constraints": num_constraints,
            "num_variables": num_variables,
            "num_nonzeros": num_nonzeros,
            "size_category": size_category,
        }

        if is_milp:
            num_cont, num_int = 0, 0
            for i in range(num_variables):
                match highs.getColIntegrality(i)[1]:
                    case highspy.HighsVarType.kInteger:
                        num_int += 1
                    case highspy.HighsVarType.kContinuous:
                        num_cont += 1

            model_stats["num_continuous_variables"] = num_cont
            model_stats["num_integer_variables"] = num_int

        print(f"Analysis complete for {file_path}. Stats:\n  {model_stats}")
        return model_stats

    except Exception as e:
        print(f"Error analyzing {file_path}: {e}", file=sys.stderr)
        return None


def get_extension(url_path: str) -> str:
    """Returns the file extension (e.g. `mps.gz`) from a URL's path."""
    known_extensions = {
        ".lp": "lp",
        ".lp.gz": "lp.gz",
        ".mps": "mps",
        ".mps.gz": "mps.gz",
    }
    for ext, res in known_extensions.items():
        if url_path.endswith(ext):
            return res
    raise ValueError(f"Unknown URL extension {url_path}")


def download_benchmark_file(
    url: str,
    use_cache: bool,
    cache_dir: Path | None = None,
) -> Path | None:
    """
    Download a benchmark file and return the local path.

    Behaviour depends on `use_cache`:

    - If use_cache=True:
        The file is stored permanently in `cache_dir`.
        If the file already exists, it is reused and not downloaded again.
        This is suitable for HPC / runner workflows.

    - If use_cache=False:
        The file is downloaded into a temporary file.
        The caller is responsible for deleting it after analysis.
        This is suitable for CI or stateless execution.

    Gzipped files (.lp.gz, .mps.gz) are automatically decompressed.
    """

    try:
        if not url or url.lower() == "none" or "http" not in url.lower():
            raise ValueError(f"Invalid URL: {url}")

        parsed_url = urlparse(url)
        extension = get_extension(parsed_url.path)

        # Determine destination path

        if use_cache:
            if cache_dir is None:
                raise ValueError("cache_dir must be provided when use_cache=True")

            cache_dir.mkdir(parents=True, exist_ok=True)

            filename = Path(parsed_url.path).name
            target_path = cache_dir / filename

            # If already downloaded and uncompressed
            if extension.endswith(".gz"):
                if extension not in ("lp.gz", "mps.gz"):
                    raise ValueError(f"Unsupported gz extension: {extension}")

                uncompressed_path = cache_dir / Path(filename).with_suffix("").name

                if uncompressed_path.exists():
                    return uncompressed_path

            else:
                if target_path.exists():
                    return target_path

        else:
            # Temporary mode
            target_path = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=f".{extension}",
            )
            target_path = Path(target_path.name)

        print(f"Downloading {url}")

        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(target_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Handle gzip

        if extension.endswith(".gz"):
            if extension == "lp.gz":
                suffix = ".lp"
            elif extension == "mps.gz":
                suffix = ".mps"
            else:
                raise ValueError(f"Unsupported gz extension: {extension}")

            if use_cache:
                uncompressed_path = (
                    cache_dir / Path(parsed_url.path).with_suffix("").name
                )
            else:
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                uncompressed_path = Path(tmp.name)
                tmp.close()

            with gzip.open(target_path, "rb") as gz_file:
                with open(uncompressed_path, "wb") as out:
                    out.write(gz_file.read())

            # remove compressed file
            target_path.unlink(missing_ok=True)

            return uncompressed_path

        return target_path

    except Exception as e:
        print(f"Error processing {url}: {e}", file=sys.stderr)
        return None


def update_size_in_yaml(yaml_data, model_name, size_name, model_stats):
    """
    Update the Size field in the YAML data structure.

    Args:
        yaml_data (dict): YAML data structure
        model_name (str): Name of the model
        size_name (str): Name of the size entry
        model_stats (dict): Stats about the model (num vars, etc)

    Returns:
        bool: True if update was successful, False otherwise
    """
    model_info = yaml_data["benchmarks"][model_name]
    for size in model_info["Sizes"]:
        if size["Name"] == size_name:
            size["Size"] = model_stats["size_category"]
            size["Num. constraints"] = model_stats["num_constraints"]
            size["Num. variables"] = model_stats["num_variables"]

            # Insert Num. nonzeros immediately after Num. variables
            if "Num. nonzeros" in size:
                size["Num. nonzeros"] = model_stats["num_nonzeros"]
            else:
                keys = list(size.keys())
                insert_index = keys.index("Num. variables") + 1
                size.insert(insert_index, "Num. nonzeros", model_stats["num_nonzeros"])

            if model_info["Problem class"] == "MILP":
                size["Num. continuous variables"] = model_stats[
                    "num_continuous_variables"
                ]
                size["Num. integer variables"] = model_stats["num_integer_variables"]
            return True

    return False


def process_metadata_files(benchmark_folder, output_folder, use_cache: bool):
    """
    Process all metadata YAML files, download benchmark models,
    analyze them, and update size values.
    """
    benchmarks_dir = Path(benchmark_folder)

    total_files = 0
    successful_downloads = 0
    successful_analyses = 0
    successful_updates = 0
    failed_tasks = 0

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = float("inf")

    # Find all metadata files recursively
    for file_path in sorted(benchmarks_dir.rglob("[Mm]etadata*.yaml")):
        try:
            if file_path.stat().st_size == 0:
                continue

            # Read the file contents as a string first to preserve exact formatting
            with open(file_path, "r") as file:
                file_content = file.read()

            if not file_content.strip():
                continue

            yaml_data = yaml.load(file_content)

            if not yaml_data or "benchmarks" not in yaml_data:
                continue

            for model_name, model_info in yaml_data["benchmarks"].items():
                # Skip None values (commented out entries)
                if model_info is None:
                    continue

                if "Sizes" in model_info and model_info["Sizes"]:
                    for size in model_info["Sizes"]:
                        if "URL" in size and size["URL"] and "Name" in size:
                            url = size["URL"]
                            size_name = size["Name"]

                            total_files += 1
                            model_path = download_benchmark_file(
                                url,
                                use_cache=use_cache,
                                cache_dir=Path(output_folder),
                            )

                            if model_path is not None:
                                successful_downloads += 1

                                # Skip time consuming analysis if metadata already contains stats
                                required_fields = [
                                    "Num. constraints",
                                    "Num. variables",
                                    "Num. nonzeros",
                                ]

                                if model_info["Problem class"] == "MILP":
                                    required_fields.extend(
                                        [
                                            "Num. continuous variables",
                                            "Num. integer variables",
                                        ]
                                    )

                                # Check whether stats are complete and valid
                                stats_complete = all(
                                    size.get(field) is not None
                                    for field in required_fields
                                )

                                stats_valid = (
                                    size.get("Num. variables", 0) > 0
                                    and size.get("Num. constraints", 0) > 0
                                    and size.get("Num. nonzeros", 0) > 0
                                )

                                if stats_complete and stats_valid:
                                    print(
                                        f"Skipping analysis for {model_name} size {size_name}"
                                    )
                                    if not use_cache:
                                        Path(model_path).unlink(missing_ok=True)
                                    continue

                                model_stats = analyze_model_file(
                                    model_path,
                                    model_info["Problem class"] == "MILP",
                                )

                                if not use_cache:
                                    Path(model_path).unlink(missing_ok=True)

                                if model_stats:
                                    successful_analyses += 1

                                    if update_size_in_yaml(
                                        yaml_data,
                                        model_name,
                                        size_name,
                                        model_stats,
                                    ):
                                        successful_updates += 1
                                        # Write to file immediately after successful update
                                        with open(file_path, "w") as file:
                                            yaml_writer = YAML()
                                            yaml_writer.preserve_quotes = True
                                            yaml_writer.width = float("inf")
                                            yaml_writer.dump(yaml_data, file)
                                        print(f"Updated {model_name} with model stats")
                            else:
                                failed_tasks += 1

        except Exception as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            failed_tasks += 1

    # Print summary
    print("\nProcessing Summary:")
    print(f"Total files found: {total_files}")
    print(f"Successfully downloaded: {successful_downloads}")
    print(f"Successfully analyzed: {successful_analyses}")
    print(f"Successfully updated: {successful_updates}")
    print(f"Failed tasks: {failed_tasks}")


def main():
    """Main function to parse arguments and call the processing function."""
    parser = argparse.ArgumentParser(
        description="Download, analyze benchmark models, and update metadata."
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
        help="Path to store downloaded LP/MPS files when caching is enabled (default: ./runner/benchmarks)",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Download files to temporary storage instead of using the cache directory",
    )
    args = parser.parse_args()

    process_metadata_files(
        benchmark_folder=args.folder,
        output_folder=args.output_folder,
        use_cache=not args.no_cache,
    )


if __name__ == "__main__":
    main()
    # cleanup_metadata_files("./benchmarks")

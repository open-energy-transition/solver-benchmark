#!/usr/bin/env python3
"""
Script to scan for metadata YAML files in benchmark folders,
download benchmark models from GCS URLs, analyze them with highspy,
and update Size values based on the number of variables.
"""

import argparse
import gzip
import os
import shutil
import sys
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
    Analyze a model file using highspy to extract the number of variables.

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
        assert num_variables == highs.numVariables
        size_category = determine_size_category(num_variables)
        model_stats = {
            "num_constraints": highs.numConstrs,
            "num_variables": num_variables,
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


def download_benchmark_file(url: str, target_path: Path) -> Path | None:
    """
    Download a file from the given URL to the target path.

    Args:
        url (str): URL to download from
        target_path (Path): Path where the file should be saved
    """
    # TODO this is mostly a copy of the function in run_benchmarks.py. Refactor!
    try:
        # Check if the URL is valid
        if not url or url.lower() == "none" or "http" not in url.lower():
            raise ValueError(f"Invalid URL: {url}")

        # Create parent directories if they don't exist
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # If target_path ends with .gz, prepare for the uncompressed version
        if target_path.suffix == ".gz":
            uncompressed_target_path = target_path.with_suffix("")
        else:
            uncompressed_target_path = target_path

        # Check if file already exists
        file_exists = uncompressed_target_path.exists()
        if file_exists:
            print(f"File already exists: {target_path}")
            return uncompressed_target_path

        print(f"Downloading {url} to {target_path}")

        # Perform the download with streaming to handle large files
        with requests.get(url, stream=True) as response:
            response.raise_for_status()
            with open(target_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        print(f"Download complete: {target_path}")

        # Unzip if necessary
        if target_path.suffix == ".gz":
            print(f"Unzipping {target_path}...")
            with gzip.open(target_path, "rb") as gz_file:
                with open(uncompressed_target_path, "wb") as uncompressed_file:
                    shutil.copyfileobj(gz_file, uncompressed_file)
            os.remove(target_path)
            print(f"Unzipped to {uncompressed_target_path}.")
        return uncompressed_target_path

    except Exception as e:
        print(f"Error processing {url}: {e}", file=sys.stderr)
        # Remove partial downloads
        if not file_exists and target_path.exists():
            target_path.unlink()
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
    # try:
    model_info = yaml_data["benchmarks"][model_name]
    for size in model_info["Sizes"]:
        if size["Name"] == size_name:
            size["Size"] = model_stats["size_category"]
            size["Num. constraints"] = model_stats["num_constraints"]
            size["Num. variables"] = model_stats["num_variables"]
            if model_info["Technique"] == "MILP":
                size["Num. continuous variables"] = model_stats[
                    "num_continuous_variables"
                ]
                size["Num. integer variables"] = model_stats["num_integer_variables"]
            return True

    return False


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


def process_metadata_files(benchmark_folder, output_folder):
    """
    Process all metadata YAML files, download benchmark models, analyze them,
    and update size values.

    Args:
        benchmark_folder (str): Path to benchmark folder containing metadata files
        output_folder (str): Path where downloaded files should be stored
    """
    benchmarks_dir = Path(benchmark_folder)
    output_dir = Path(output_folder)

    total_files = 0
    successful_downloads = 0
    successful_analyses = 0
    successful_updates = 0
    failed_tasks = 0

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = float("inf")  # Prevent line wrapping

    # Find all metadata files recursively
    for file_path in sorted(benchmarks_dir.rglob("[Mm]etadata*.yaml")):
        try:
            if os.path.getsize(file_path) == 0:
                continue

            # Read the file contents as a string first to preserve exact formatting
            with open(file_path, "r") as file:
                file_content = file.read()

            if not file_content.strip():
                continue

            yaml_parser = YAML()
            yaml_parser.preserve_quotes = True
            yaml_parser.width = float("inf")  # Prevent line wrapping
            yaml_data = yaml_parser.load(file_content)

            if not yaml_data or "benchmarks" not in yaml_data:
                continue

            # Flag to track if any changes were made to this file
            file_updated = False

            for model_name, model_info in yaml_data["benchmarks"].items():
                # Skip None values (commented out entries)
                if model_info is None:
                    continue

                if "Sizes" in model_info and model_info["Sizes"]:
                    for size in model_info["Sizes"]:
                        if "URL" in size and size["URL"] and "Name" in size:
                            url = size["URL"]
                            size_name = size["Name"]

                            parsed_url = urlparse(url)
                            extension = get_extension(parsed_url.path)
                            filename = f"{model_name}-{size_name}.{extension}"

                            target_path = output_dir / filename

                            total_files += 1
                            model_path = download_benchmark_file(url, target_path)

                            if model_path is not None:
                                successful_downloads += 1

                                # Skip time consuming analysis if metadata already contains stats
                                if size.get("Num. variables") is not None:
                                    print(
                                        f"Skipping analysis for {model_name} size {size_name}"
                                    )
                                    continue

                                model_stats = analyze_model_file(
                                    model_path, model_info["Technique"] == "MILP"
                                )

                                if model_stats:
                                    successful_analyses += 1

                                    if update_size_in_yaml(
                                        yaml_data, model_name, size_name, model_stats
                                    ):
                                        successful_updates += 1
                                        file_updated = True
                                        print(f"Updated {model_name} with model stats")
                            else:
                                failed_tasks += 1

            if file_updated:
                with open(file_path, "w") as file:
                    # Use the same YAML parser with infinite width to preserve formatting
                    yaml_writer = YAML()
                    yaml_writer.preserve_quotes = True
                    yaml_writer.width = float("inf")  # Prevent line wrapping
                    yaml_writer.dump(yaml_data, file)
                print(f"Updated YAML file: {file_path}")

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
    print(f"Files stored in: {output_dir}")


def cleanup_metadata_files(benchmark_folder):
    """
    Go through metadata files and remove old manually-computed size stats.

    Args:
        benchmark_folder (str): Path to benchmark folder containing metadata files
    """
    benchmarks_dir = Path(benchmark_folder)

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = float("inf")  # Prevent line wrapping

    # Find all metadata files recursively
    for file_path in sorted(benchmarks_dir.rglob("[Mm]etadata*.yaml")):
        if os.path.getsize(file_path) == 0:
            continue

        # Read the file contents as a string first to preserve exact formatting
        with open(file_path, "r") as file:
            file_content = file.read()

        if not file_content.strip():
            continue

        yaml_parser = YAML()
        yaml_parser.preserve_quotes = True
        yaml_parser.width = float("inf")  # Prevent line wrapping
        yaml_data = yaml_parser.load(file_content)

        if not yaml_data or "benchmarks" not in yaml_data:
            continue

        for _benchmark_name, benchmark_info in yaml_data["benchmarks"].items():
            for size in benchmark_info["Sizes"]:
                keys_to_remove = [k for k in size if k.startswith("N. of ")]
                for k in keys_to_remove:
                    del size[k]

        with open(file_path, "w") as file:
            # Use the same YAML parser with infinite width to preserve formatting
            yaml_writer = YAML()
            yaml_writer.preserve_quotes = True
            yaml_writer.width = float("inf")  # Prevent line wrapping
            yaml_writer.dump(yaml_data, file)
        print(f"Updated YAML file: {file_path}")


def main():
    """Main function to parse arguments and call the processing function."""
    parser = argparse.ArgumentParser(
        description="Download, analyze benchmark models, and update size values in metadata YAML files."
    )
    parser.add_argument(
        "--folder",
        type=str,
        default="./benchmarks",
        help="Path to the benchmark folder with metadata files (default: ./benchmarks)",
    )
    parser.add_argument(
        "--output_folder",
        type=str,
        default="./runner/benchmarks",
        help="Path to store the downloaded LP/MPS files (default: ./runner/benchmarks)",
    )
    args = parser.parse_args()

    process_metadata_files(args.folder, args.output_folder)


if __name__ == "__main__":
    main()
    # cleanup_metadata_files("./benchmarks")

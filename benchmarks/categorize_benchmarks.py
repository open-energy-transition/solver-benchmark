#!/usr/bin/env python3
"""
Script to scan for metadata YAML files in benchmark folders,
download benchmark models from GCS URLs, analyze them with highspy,
and update Size values based on the number of variables.
"""

import argparse
import os
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


def analyze_model_file(file_path):
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
        size_category = determine_size_category(num_variables)

        model_stats = {"num_variables": num_variables, "size_category": size_category}

        print(f"Analysis complete for {file_path}")
        print(f"Variables: {model_stats['num_variables']}")
        print(f"Size Category: {model_stats['size_category']}")

        return model_stats

    except Exception as e:
        print(f"Error analyzing {file_path}: {e}", file=sys.stderr)
        return None


def download_and_analyze_file(url, target_path):
    """
    Download a file from the given URL to the target path and analyze it.

    Args:
        url (str): URL to download from
        target_path (Path): Path where the file should be saved

    Returns:
        tuple: (success_status, model_stats)
    """
    try:
        # Check if the URL is valid
        if not url or url.lower() == "none" or "http" not in url.lower():
            print(f"Skipping invalid URL: {url}")
            return (False, None)

        # Create parent directories if they don't exist
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # Check if file already exists
        file_exists = target_path.exists()

        if not file_exists:
            print(f"Downloading {url} to {target_path}")

            # Perform the download with streaming to handle large files
            with requests.get(url, stream=True) as response:
                response.raise_for_status()
                with open(target_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

            print(f"Download complete: {target_path}")
        else:
            print(f"File already exists: {target_path}")

        # Analyze the model file
        model_stats = analyze_model_file(target_path)

        return (True, model_stats)

    except Exception as e:
        print(f"Error processing {url}: {e}", file=sys.stderr)
        # Remove partial downloads
        if not file_exists and target_path.exists():
            target_path.unlink()
        return (False, None)


def update_size_in_yaml(yaml_data, model_name, size_name, new_size):
    """
    Update the Size field in the YAML data structure.

    Args:
        yaml_data (dict): YAML data structure
        model_name (str): Name of the model
        size_name (str): Name of the size entry
        new_size (str): New size value (S, M, or L)

    Returns:
        bool: True if update was successful, False otherwise
    """
    try:
        model_info = yaml_data["benchmarks"][model_name]
        for size in model_info["Sizes"]:
            if size["Name"] == size_name:
                size["Size"] = new_size
                return True

        return False

    except (KeyError, TypeError):
        print(f"Error updating size for {model_name} - {size_name}", file=sys.stderr)
        return False


def process_metadata_files(benchmark_folder, tmp_folder="/tmp"):
    """
    Process all metadata YAML files, download benchmark models, analyze them,
    and update size values.

    Args:
        benchmark_folder (str): Path to benchmark folder containing metadata files
        tmp_folder (str): Path where downloaded files should be stored
    """
    benchmarks_dir = Path(benchmark_folder)
    tmp_dir = Path(tmp_folder) / "benchmark_models"

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
                            filename = os.path.basename(parsed_url.path)

                            target_path = tmp_dir / filename

                            total_files += 1
                            download_success, model_stats = download_and_analyze_file(
                                url, target_path
                            )

                            if download_success:
                                successful_downloads += 1

                                if model_stats:
                                    successful_analyses += 1

                                    new_size = model_stats["size_category"]
                                    if update_size_in_yaml(
                                        yaml_data, model_name, size_name, new_size
                                    ):
                                        successful_updates += 1
                                        file_updated = True
                                        print(
                                            f"Updated {model_name} - {size_name} to size {new_size}"
                                        )
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
    print(f"Files stored in: {tmp_dir}")


def main():
    """Main function to parse arguments and call the processing function."""
    parser = argparse.ArgumentParser(
        description="Download, analyze benchmark models, and update size values in metadata YAML files."
    )
    parser.add_argument(
        "--folder",
        type=str,
        default="./",
        help="Path to the benchmark folder (default: ./benchmarks)",
    )
    parser.add_argument(
        "--tmp",
        type=str,
        default="/tmp",
        help="Path to store downloaded files (default: /tmp)",
    )
    args = parser.parse_args()

    process_metadata_files(args.folder, args.tmp)


if __name__ == "__main__":
    main()

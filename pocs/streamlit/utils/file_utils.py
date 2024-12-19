from pathlib import Path

import pandas as pd
import yaml


# Load benchmark metadata
def load_metadata(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


def load_benchmark_data(file_path="../results/benchmark_results.csv"):
    """
    Load benchmark data from the specified folder and file.

    Parameters:
        file_path (str): Relative or absolute path to the CSV file. Defaults to "results/benchmark_results.csv".

    Returns:
        pd.DataFrame: Loaded data as a pandas DataFrame.
    """
    # Construct the absolute file path
    absolute_file_path = Path(__file__).resolve().parent.parent.parent / file_path
    try:
        # Load and return the data
        data = pd.read_csv(absolute_file_path)

        # TODO: Replace the hardcoded Runtime and Memory Usage values with dynamically loaded values from a configuration file.
        if "Runtime (s)" in data.columns and "Status" in data.columns:
            timeout_value = data.loc[data["Status"] == "TO", "Runtime (s)"].max()
            data.loc[data["Status"] != "ok", "Runtime (s)"] = (
                timeout_value if not pd.isna(timeout_value) else 60
            )
            data.loc[data["Status"] != "ok", "Memory Usage (MB)"] = 8192
        elif "Runtime Mean (s)" in data.columns and "Status" in data.columns:
            timeout_value = data.loc[data["Status"] == "TO", "Runtime Mean (s)"].max()

            data.loc[data["Status"] != "ok", "Runtime Mean (s)"] = (
                timeout_value if not pd.isna(timeout_value) else 60
            )
            data.loc[data["Status"] != "ok", "Memory Usage (MB)"] = 8192

        return data
    except FileNotFoundError:
        raise FileNotFoundError(
            f"The file {file_path} was not found. Please check the path and try again."
        )
    except pd.errors.ParserError:
        raise ValueError(
            f"Error parsing the file {file_path}. Please check the file format and ensure it's a valid CSV."
        )

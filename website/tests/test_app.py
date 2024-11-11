from pathlib import Path

import pandas as pd
from utils.file_utils import load_metadata


def test_benchmark_mismatch():
    # Define paths to CSV and metadata files
    data_url = Path(__file__).parent.parent / "../results/benchmark_results.csv"
    metadata_path = Path(__file__).parent.parent / "../benchmarks/pypsa/metadata.yaml"

    # Load metadata and data
    metadata = load_metadata(metadata_path)
    metadata_df = pd.DataFrame(metadata).T.reset_index()
    metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)
    data_df = pd.read_csv(data_url)

    # Perform the comparison
    csv_benchmarks = set(data_df["Benchmark"].unique())
    metadata_benchmarks = set(metadata_df["Benchmark Name"].unique())

    # Check for mismatches
    if csv_benchmarks != metadata_benchmarks:
        mismatch_message = (
            f"Mismatch between CSV benchmarks and metadata benchmarks:\n"
            f"In CSV but not metadata: {csv_benchmarks - metadata_benchmarks}\n"
            f"In metadata but not CSV: {metadata_benchmarks - csv_benchmarks}"
        )
        assert False, mismatch_message
    else:
        assert True  # Pass the test if there is no mismatch

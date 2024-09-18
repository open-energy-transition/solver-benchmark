from pathlib import Path

import pandas as pd
import streamlit as st
import yaml

# local
from components.benchmark_table import display_table
from components.filter import generate_filtered_metadata


# Load benchmark metadata
def load_metadata(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)


# Custom CSS
st.markdown(
    """
    <style>
    .block-container {
      max-width: 100%;
    }

    .st-multiselect {
        background-color: rgba(151, 166, 195, 0.25) !important;
        color: black; /* Text color */
    }
    .st-multiselect select {
        background-color: rgba(151, 166, 195, 0.25) !important;
    }
    .st-multiselect select option {
        background-color: rgba(151, 166, 195, 0.25) !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Benchmarks")

filtered_metadata = generate_filtered_metadata(metadata_df)

# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    total_benchmarks = len(metadata_df["Benchmark Name"].unique())
    active_benchmarks = len(filtered_metadata["Benchmark Name"].unique())
    if total_benchmarks is not active_benchmarks:
        st.write(
            f"### Filters are active; showing {active_benchmarks}/{total_benchmarks} benchmarks."
        )
    else:
        st.write("### Showing all benchmarks")

    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

# Round the DataFrame values
df = df.round({"Objective Value": 2, "Runtime (s)": 1, "Memory Usage (MB)": 0})

# Display the filtered table
filtered_df = display_table(df)

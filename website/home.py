from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st
from components.filter import generate_filtered_metadata
from components.home_chart import render_benchmark_scatter_plot
from packaging.version import parse
from utils.file_utils import load_metadata

metadata = load_metadata("results/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Title of the app
st.title("OET/BE Solver Benchmark")

st.markdown(
    """
    This website is an open-source benchmark of LP/MILP solvers on representative problems from the energy planning domain.
    The website aims to help energy system modelers decide the best solver for their application; solver developers improve their solvers using realistic and important examples; and funders accelerate the green transition by giving them reliable metrics to evaluate solver performance over time.
    We accept community contributions for new benchmarks, new / updated solver versions, and feedback on the benchmarking methodology and metrics via our [GitHub repository](https://github.com/orgs/open-energy-transition/solver-benchmark).

    This project was developed by [Open Energy Transition](https://openenergytransition.org/), with funding from [Breakthrough Energy](https://www.breakthroughenergy.org/).

    | **Details** | |
    | ------------- | ------------- |
    | **Solvers** | 3: HiGHS, GLPK, SCIP |
    | **Benchmarks** | 6 |
    | **Iterations** | 1 |
    | **Timeout** | 15 min |
    | **vCPU** | 2 (1 core) |
    | **Memory** | 8GB |
    """
)

# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)

if filtered_metadata.empty:
    st.warning("No matching models found. Please adjust your filter selections.")

# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
raw_df = pd.read_csv(data_url)
df = raw_df

# Assert that the set of benchmark names in the metadata matches those in the data
csv_benchmarks = set(raw_df["Benchmark"].unique())
metadata_benchmarks = set(metadata_df["Benchmark Name"].unique())
# Assertion to check if both sets are the same
assert csv_benchmarks == metadata_benchmarks, (
    f"Mismatch between CSV benchmarks and metadata benchmarks:\n"
    f"In CSV but not metadata: {csv_benchmarks - metadata_benchmarks}\n"
    f"In metadata but not CSV: {metadata_benchmarks - csv_benchmarks}"
)

# Sort the DataFrame by Benchmark and Runtime to ensure logical line connections
df = df.sort_values(by=["Benchmark", "Runtime (s)"])

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df["Solver Version"] = df["Solver Version"].apply(parse)
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Size", "Benchmark"], keep="first")

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]


def combine_sgm_tables(df, shift=10):
    """
    Combine SGM tables into a single table with SGM Runtime, SGM Memory, and Solved Benchmarks.

    Columns:
    - Solver
    - Version
    - SGM Runtime (normalized)
    - SGM Memory (normalized)
    - Solved Benchmarks (number of benchmarks solved)
    """
    sgm_runtime_data = []
    grouped = df.groupby(["Solver", "Solver Version"])
    for (solver, version), group in grouped:
        # Calculate SGM for Runtime
        runtime_values = group["Runtime (s)"]
        sgm_runtime = np.exp(np.mean(np.log(np.maximum(1, runtime_values + shift)))) - shift

        # Calculate the number of benchmarks solved
        solved_benchmarks = len(group[group["Status"] == "ok"])

        sgm_runtime_data.append({
            "Solver": solver,
            "Version": version,
            "SGM Runtime": sgm_runtime,
            "Solved Benchmarks": solved_benchmarks,
        })

    # Normalize SGM Runtime
    sgm_runtime_min = min(row["SGM Runtime"] for row in sgm_runtime_data)
    for row in sgm_runtime_data:
        row["SGM Runtime (Normalized)"] = row["SGM Runtime"] / sgm_runtime_min

    # Calculate SGM for Memory Usage
    sgm_memory_data = []
    for (solver, version), group in grouped:
        memory_values = group["Memory Usage (MB)"]
        sgm_memory = np.exp(np.mean(np.log(np.maximum(1, memory_values + shift)))) - shift

        sgm_memory_data.append({
            "Solver": solver,
            "Version": version,
            "SGM Memory": sgm_memory,
        })

    # Normalize SGM Memory
    sgm_memory_min = min(row["SGM Memory"] for row in sgm_memory_data)
    for row in sgm_memory_data:
        row["SGM Memory (Normalized)"] = row["SGM Memory"] / sgm_memory_min

    # Combine Data into a Single Table
    combined_df = pd.DataFrame(sgm_runtime_data).merge(
        pd.DataFrame(sgm_memory_data),
        on=["Solver", "Version"],
    )

    # Drop raw SGM values
    combined_df = combined_df[
        ["Solver", "Version", "SGM Runtime (Normalized)", "SGM Memory (Normalized)", "Solved Benchmarks"]
    ]

    # Sort by SGM Runtime (Normalized)
    combined_df = combined_df.sort_values(by="SGM Runtime (Normalized)")

    return combined_df


# Generate the Combined Table
sgm_combined_df = combine_sgm_tables(df)

# Display the Combined Table
st.subheader("Results")
st.caption("Solver performance across benchmarks")
st.table(sgm_combined_df)


# Render scatter plot
render_benchmark_scatter_plot(df, metadata, key="home_scatter_plot")

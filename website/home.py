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

# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
raw_df = pd.read_csv(data_url)
df = raw_df

# Compute "Solvers", "Benchmarks", and "Timeout" details from the results CSV
solvers = df["Solver"].unique()
solvers_count = len(solvers)
solvers_list = ", ".join(solvers)

benchmarks = df["Benchmark"].unique()
benchmarks_count = len(benchmarks)
# Convert benchmarks to uppercase
benchmarks_list_uppercase = ", ".join([b.upper() for b in benchmarks])

# Calculate the unique benchmark-size combinations
unique_benchmark_sizes = df[["Benchmark", "Size"]].drop_duplicates()
sizes_count = len(unique_benchmark_sizes)

# Calculate the timeout from TO benchmarks
timeout = df[df["Status"] == "TO"]["Runtime (s)"].max() // 1

# Title of the app
st.title("OET/BE Solver Benchmark")

st.markdown(
    f"""
    This website is an open-source benchmark of LP/MILP solvers on representative problems from the energy planning domain.
    The website aims to help energy system modelers decide the best solver for their application; solver developers improve their solvers using realistic and important examples; and funders accelerate the green transition by giving them reliable metrics to evaluate solver performance over time.
    We accept community contributions for new benchmarks, new / updated solver versions, and feedback on the benchmarking methodology and metrics via our [GitHub repository](https://github.com/orgs/open-energy-transition/solver-benchmark).

    This project was developed by [Open Energy Transition](https://openenergytransition.org/), with funding from [Breakthrough Energy](https://www.breakthroughenergy.org/).

    | **Details** | |
    | ------------- | ------------- |
    | **Solvers** | {solvers_count}: {solvers_list} |
    | **Benchmarks** | {benchmarks_count} ({sizes_count}, including sizes) |
    | **Timeout** | {timeout} min |
    | **vCPU** | 2 (1 core) |
    | **Memory** | 8GB |
    """
)


# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)

if filtered_metadata.empty:
    st.warning("No matching models found. Please adjust your filter selections.")


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


# Calculate Shifted Geometric Mean (SGM)
def calculate_sgm(df, shift=10, column_name="Runtime (s)"):
    """
    Calculate the Shifted Geometric Mean (SGM) for each solver.
    """
    sgm_data = []
    grouped = df.groupby("Solver")
    for solver, group in grouped:
        column_values = group[column_name]
        # Calculate SGM # TODO this can be done within pd DataFrames
        sgm = np.exp(np.mean(np.log(np.maximum(1, column_values + shift)))) - shift
        sgm_data.append({"Solver": solver, "SGM (Raw)": sgm})

    # Normalize SGM
    min_sgm = min(entry["SGM (Raw)"] for entry in sgm_data)
    for entry in sgm_data:
        entry["SGM (Normalized)"] = entry["SGM (Raw)"] / min_sgm

    return pd.DataFrame(sgm_data).sort_values(by="SGM (Normalized)")


# Display SGM Table for Runtimes
sgm_runtime_df = calculate_sgm(df)
st.subheader("Shifted Geometric Mean (SGM) of Runtimes")
st.table(sgm_runtime_df)


# Display SGM Table for Memory Usage
sgm_memoryuse_df = calculate_sgm(df, column_name="Memory Usage (MB)")
st.subheader("Shifted Geometric Mean (SGM) of Memory Usage")
st.table(sgm_memoryuse_df)


# Render scatter plot
render_benchmark_scatter_plot(df, metadata, key="home_scatter_plot")

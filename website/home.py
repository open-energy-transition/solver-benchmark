import humanize
import pandas as pd
import streamlit as st
from components.filter import display_filter_status, generate_filtered_metadata
from components.home_chart import render_benchmark_scatter_plot
from packaging.version import parse
from utils.file_utils import load_benchmark_data, load_metadata

from website.utils.calculations import calculate_sgm
from website.utils.filters import filter_data

metadata = load_metadata("results/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Load the data from the CSV file
raw_df = load_benchmark_data()
df = raw_df

# Compute "Solvers", "Benchmarks", and "Timeout" details from the results CSV
solvers = df["Solver"].unique()
solvers_count = len(solvers)
unique_solver_versions_count = len(df[["Solver", "Solver Version"]].drop_duplicates())

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
    df = filter_data(df, filtered_metadata)

# Filter status
display_filter_status(df, filtered_metadata)


def combine_sgm_tables(df):
    """
    Combine SGM tables into a single table with SGM Runtime, SGM Memory, and Solved Benchmarks.

    Columns:
    - Solver
    - Version
    - SGM Runtime (normalized)
    - SGM Memory (normalized)
    - Solved Benchmarks (number of benchmarks solved)
    """
    # Ensure the "Solver Version" column is in a compatible format
    df["Solver Version"] = df["Solver Version"].astype(str)

    sgm_runtime_data = []
    grouped = df.groupby(["Solver", "Solver Version"])
    for (solver, version), group in grouped:
        # Calculate SGM for Runtime
        runtime_values = group["Runtime (s)"]
        sgm_runtime = calculate_sgm(runtime_values)

        # Calculate Min and Max Runtime
        min_runtime = runtime_values.min()

        # Exclude TO values for max_runtime based on runtime and status
        runtime_status = group[["Runtime (s)", "Status"]]
        valid_runtimes = runtime_status[runtime_status["Status"] == "ok"]["Runtime (s)"]
        max_runtime = (valid_runtimes.max()) if not valid_runtimes.empty else "N/A"

        # Calculate the number of benchmarks solved
        solved_benchmarks = len(group[group["Status"] == "ok"])

        sgm_runtime_data.append(
            {
                "Solver": solver,
                "Version": version,
                "Min Runtime": min_runtime,
                "Max Runtime": max_runtime,
                "SGM Runtime": sgm_runtime,
                "Solved Benchmarks": solved_benchmarks,
            }
        )

    # Normalize SGM Runtime
    sgm_runtime_min = min(row["SGM Runtime"] for row in sgm_runtime_data)
    for row in sgm_runtime_data:
        row["SGM Runtime"] = row["SGM Runtime"] / sgm_runtime_min

    # Calculate SGM for Memory Usage
    sgm_memory_data = []
    for (solver, version), group in grouped:
        memory_values = group["Memory Usage (MB)"]
        sgm_memory = calculate_sgm(memory_values)

        sgm_memory_data.append(
            {
                "Solver": solver,
                "Version": version,
                "SGM Memory": sgm_memory,
            }
        )

    # Normalize SGM Memory
    sgm_memory_min = min(row["SGM Memory"] for row in sgm_memory_data)
    for row in sgm_memory_data:
        row["SGM Memory"] = row["SGM Memory"] / sgm_memory_min

    # Combine Data into a Single Table
    combined_df = pd.DataFrame(sgm_runtime_data).merge(
        pd.DataFrame(sgm_memory_data),
        on=["Solver", "Version"],
    )

    # Drop raw SGM values
    combined_df = combined_df[
        [
            "Solver",
            "Version",
            "Min Runtime",
            "Max Runtime",
            "SGM Runtime",
            "SGM Memory",
            "Solved Benchmarks",
        ]
    ]

    # Sort by SGM Runtime
    combined_df = combined_df.sort_values(by="SGM Runtime").reset_index(drop=True)

    return combined_df


# Calculate the unique benchmark-size combinations
benchmarks = df["Benchmark"].unique()
benchmarks_count = len(benchmarks)

sizes_count = len(df.drop_duplicates(subset=["Size", "Benchmark"], keep="first"))

# TODO: Retrieve this information (e.g., timeout, numCPUs, RAM, etc.) directly from the benchmark runner.
# Calculate the timeout from TO benchmarks
timeout_seconds = df[df["Status"] == "TO"]["Runtime (s)"].max()
timeout_seconds = timeout_seconds if not pd.isna(timeout_seconds) else 60
timeout_readable = humanize.precisedelta(timeout_seconds, minimum_unit="seconds")
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
    | **Solvers** | {solvers_count} ({unique_solver_versions_count}, including versions) |
    | **Benchmarks** | {benchmarks_count} ({sizes_count}, including sizes) |
    | **Timeout** | {timeout_readable} |
    | **vCPU** | 2 (1 core) |
    | **Memory** | 8GB |
    """
)


if not df.empty:
    # Generate the Combined Table
    sgm_combined_df = combine_sgm_tables(df)

    # Display the Combined Table
    st.subheader("Results:")
    st.write(
        f"Solved benchmarks is the number of benchmarks where the solver returns an ok status, out of {sizes_count} benchmarks"
    )
    st.table(sgm_combined_df)

# Render scatter plot
render_benchmark_scatter_plot(df, metadata, key="home_scatter_plot")

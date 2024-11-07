from pathlib import Path

import pandas as pd
import streamlit as st
from components.filter import generate_filtered_metadata

# local
from components.home_chart import render_benchmark_scatter_plot
from utils.file_utils import load_metadata

metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

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
    | **Solvers** | 4: Gurobi, HiGHS, GLPK, SCIP |
    | **Benchmarks** | 6 |
    | **Iterations** | 1 |
    | **Timeout** | 15 min |
    | **vCPU** | 2 (1 core) |
    | **Memory** | 16GB |
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
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

render_benchmark_scatter_plot(df, metadata, key="home_scatter_plot")

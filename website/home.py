# main script
from pathlib import Path

import pandas as pd
import streamlit as st
import yaml
from components.filter import generate_filtered_metadata

# local
from components.home_chart import (
    render_benchmark_scatter_plot,
    render_benchmark_violin_plot,
)


# Load benchmark metadata
def load_metadata(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


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
    | **vCPU** | 8 |
    | **Memory** | 32GB |
    """
)


# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)


# Show filtered metadata
if not filtered_metadata.empty:
    st.write(filtered_metadata)
else:
    st.warning("No matching models found. Please adjust your filter selections.")


# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

# Sort the DataFrame by Benchmark and Runtime to ensure logical line connections
df = df.sort_values(by=["Benchmark", "Runtime (s)"])

plotly_chart_key = "home_scatter_plot"
render_benchmark_scatter_plot(df, key=plotly_chart_key)

st.plotly_chart(
    render_benchmark_violin_plot(
        data=df,
        yaxis_data="Runtime (s)",
        yaxis_title="Runtime (s)",
        chart_title="Distribution of Runtime by Solver",
    )
)

st.plotly_chart(
    render_benchmark_violin_plot(
        data=df,
        yaxis_data="Memory Usage (MB)",
        yaxis_title="Memory Usage (MB)",
        chart_title="Distribution of Memory Usage by Solver",
    )
)


# Add a line of text explaining the plot and the marker symbols
st.markdown(
    """
    **Legend:** an **$\\times$** represents benchmarks that timed out (TO), while an **$\\bullet$** indicates a successful run (OK).
    """
)

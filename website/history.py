from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# local
from components.filter import generate_filtered_metadata
from utils.file_utils import load_metadata


# SGM Calculation # TODO reuse same function in home.py and here
def calculate_sgm(runtime_values, sh=10):
    runtime_values = np.maximum(1, runtime_values + sh)
    sgm = np.exp(np.mean(np.log(runtime_values))) - sh
    return sgm


# Convert metadata to a DataFrame for easier filtering
metadata = load_metadata("benchmarks/pypsa/metadata.yaml")
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)

# Load the benchmark data
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
data = pd.read_csv(data_url)

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    data = data[data["Benchmark"].isin(filtered_benchmarks)]

# Use existing years from data
data["Year"] = data["Solver Release Year"].astype(int)

# Group by Solver and Year to calculate SGMs for Runtime (s)
solver_sgm_runtime = (
    data.groupby(["Solver", "Year"])["Runtime (s)"]
    .apply(lambda x: calculate_sgm(x))
    .reset_index(name="SGM_Runtime")
)

# Normalize the SGMs for Runtime (s)
min_sgm_runtime = solver_sgm_runtime["SGM_Runtime"].min()
solver_sgm_runtime["Normalized SGM_Runtime"] = (
    solver_sgm_runtime["SGM_Runtime"] / min_sgm_runtime
)

# Group by Solver and Year to calculate SGMs for Memory Usage (MB)
solver_sgm_memory = (
    data.groupby(["Solver", "Year"])["Memory Usage (MB)"]
    .apply(lambda x: calculate_sgm(x))
    .reset_index(name="SGM_Memory")
)

# Normalize the SGMs for Memory Usage (MB)
min_sgm_memory = solver_sgm_memory["SGM_Memory"].min()
solver_sgm_memory["Normalized SGM_Memory"] = (
    solver_sgm_memory["SGM_Memory"] / min_sgm_memory
)

# Plot SGM for Runtime (s)
st.title("Solver Performance History")
st.write(
    "We use the Shifted Geometric Mean (SGM) of runtime and memory consumption over all the benchmarks, and normalize according to the best performing solver version."
)

fig_sgm_runtime = go.Figure()

for solver in solver_sgm_runtime["Solver"].unique():
    subset = solver_sgm_runtime[solver_sgm_runtime["Solver"] == solver]
    fig_sgm_runtime.add_trace(
        go.Scatter(
            x=subset["Year"],
            y=subset["Normalized SGM_Runtime"],
            mode="lines+markers",
            name=solver,
            marker=dict(size=10),
            line=dict(width=2),
            text=subset.apply(
                lambda row: f"Solver: {row['Solver']}<br>Year: {row['Year']}<br>Normalized SGM (Runtime): {row['Normalized SGM_Runtime']:.2f}",
                axis=1,
            ),
            hoverinfo="text+x+y",
        )
    )

fig_sgm_runtime.update_layout(
    title="Normalized SGM Comparison of Solvers Over Years (Runtime)",
    xaxis=dict(
        title="Year",
        tickmode="linear",
        dtick=1,
    ),
    yaxis_title="Normalized SGM (Runtime)",
    template="plotly_dark",
    height=600,
    width=1000,
)

st.plotly_chart(fig_sgm_runtime)

# Plot SGM for Memory Usage (MB)
fig_sgm_memory = go.Figure()

for solver in solver_sgm_memory["Solver"].unique():
    subset = solver_sgm_memory[solver_sgm_memory["Solver"] == solver]
    fig_sgm_memory.add_trace(
        go.Scatter(
            x=subset["Year"],
            y=subset["Normalized SGM_Memory"],
            mode="lines+markers",
            name=solver,
            marker=dict(size=10),
            line=dict(width=2),
            text=subset.apply(
                lambda row: f"Solver: {row['Solver']}<br>Year: {row['Year']}<br>Normalized SGM (Memory): {row['Normalized SGM_Memory']:.2f}",
                axis=1,
            ),
            hoverinfo="text+x+y",
        )
    )

fig_sgm_memory.update_layout(
    title="Normalized SGM Comparison of Solvers Over Years (Memory Usage)",
    xaxis=dict(
        title="Year",
        tickmode="linear",
        dtick=1,
    ),
    yaxis_title="Normalized SGM (Memory Usage)",
    template="plotly_dark",
    height=600,
    width=1000,
)

st.plotly_chart(fig_sgm_memory)

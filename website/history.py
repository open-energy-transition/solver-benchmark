from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# local
from components.filter import generate_filtered_metadata
from utils.file_utils import load_metadata

metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
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

# Define years to display on the x-axis
years = [2019, 2020, 2021, 2022, 2023]

# Duplicate the data for each year
data_repeated = pd.concat([data.assign(Year=year) for year in years])

# Find the peak memory usage and average runtime for each solver, benchmark, and year
peak_memory = (
    data_repeated.groupby(["Benchmark", "Size", "Solver", "Status", "Year"])[
        "Memory Usage (MB)"
    ]
    .max()
    .reset_index()
)
average_runtime = (
    data_repeated.groupby(["Benchmark", "Size", "Solver", "Status", "Year"])["Runtime (s)"]
    .mean()
    .reset_index()
)

# Define marker symbols based on status
status_symbols = {
    "TO": "x",  # Timeout gets an "X"
    "ok": "circle",  # Normal execution gets a circle
}

st.title("Solver Performance History")

# Add a dropdown for solver selection
solver_options = data_repeated["Solver"].unique()
selected_solver = st.selectbox("Select Solver", solver_options)

# Filter the data for the selected solver
peak_memory_filtered = peak_memory[peak_memory["Solver"] == selected_solver]
average_runtime_filtered = average_runtime[average_runtime["Solver"] == selected_solver]

# Runtime plot
fig_runtime = go.Figure()

# Add traces with different markers for statuses
for benchmark in average_runtime_filtered["Benchmark"].unique():
    subset = average_runtime_filtered[
        average_runtime_filtered["Benchmark"] == benchmark
    ]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        tooltip_text = status_subset.apply(
            lambda row: f"{row['Benchmark']}-{row['Size']} - {row['Status']}", axis=1
        )
        fig_runtime.add_trace(
            go.Scatter(
                x=status_subset["Year"],  # Use Year as x-axis
                y=round(status_subset["Runtime (s)"], 1),
                mode="markers",
                name=f"{benchmark} - {status}",
                marker=dict(
                    symbol=symbol,  # Marker shape based on status
                    size=10,
                ),
                text=tooltip_text,  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
            )
        )

fig_runtime.update_layout(
    title=f"Solver Runtime Comparison for {selected_solver}",
    xaxis_title="Year",
    yaxis_title="Runtime (s)",
    template="plotly_dark",
)

# Memory usage plot
fig_memory = go.Figure()

# Add traces with different markers for statuses
for benchmark in peak_memory_filtered["Benchmark"].unique():
    subset = peak_memory_filtered[peak_memory_filtered["Benchmark"] == benchmark]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        tooltip_text = status_subset.apply(
            lambda row: f"{row['Benchmark']}-{row['Size']} - {row['Status']}", axis=1
        )
        fig_memory.add_trace(
            go.Scatter(
                x=status_subset["Year"],  # Use Year as x-axis
                y=round(status_subset["Memory Usage (MB)"]),
                mode="markers",
                name=f"{benchmark} - {status}",
                marker=dict(
                    symbol=symbol,  # Marker shape based on status
                    size=10,
                ),
                text=tooltip_text,  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
            )
        )

fig_memory.update_layout(
    title=f"Solver Peak Memory Consumption for {selected_solver}",
    xaxis_title="Year",
    yaxis_title="Memory Usage (MB)",
    template="plotly_dark",
)

# Explanation for the legend
st.markdown(
    """
    These plots show the evolution of solver performance over time.

    **Legend:** an **$\\times$** represents benchmarks that timed out (TO), while an **$\\bullet$** indicates a successful run (OK).
    """
)

# Display plots
st.plotly_chart(fig_runtime)
st.plotly_chart(fig_memory)

from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# Load the data
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
data = pd.read_csv(data_url)

st.title("Solver Performance History")

# Define years to display on the x-axis
years = [2019, 2020, 2021, 2022, 2023]

# Duplicate the data for each year
data_repeated = pd.concat([data.assign(Year=year) for year in years])

# Find the peak memory usage and average runtime for each solver, benchmark, and year
peak_memory = (
    data_repeated.groupby(["Benchmark", "Solver", "Status", "Year"])[
        "Memory Usage (MB)"
    ]
    .max()
    .reset_index()
)
average_runtime = (
    data_repeated.groupby(["Benchmark", "Solver", "Status", "Year"])["Runtime (s)"]
    .mean()
    .reset_index()
)

# Define marker symbols based on status
status_symbols = {
    "TO": "x",  # Timeout gets an "X"
    "ok": "circle",  # Normal execution gets a circle
}

# Runtime plot
fig_runtime = go.Figure()

# Add traces with different markers for statuses
for benchmark in average_runtime["Benchmark"].unique():
    subset = average_runtime[average_runtime["Benchmark"] == benchmark]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        tooltip_text = status_subset.apply(
            lambda row: f"{row['Benchmark']} - {row['Status']}", axis=1
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
    title="Solver Runtime Comparison",
    xaxis_title="Year",
    yaxis_title="Runtime (s)",
    template="plotly_dark",
)

# Memory usage plot
fig_memory = go.Figure()

# Add traces with different markers for statuses
for benchmark in peak_memory["Benchmark"].unique():
    subset = peak_memory[peak_memory["Benchmark"] == benchmark]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        tooltip_text = status_subset.apply(
            lambda row: f"{row['Benchmark']} - {row['Status']}", axis=1
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
    title="Solver Peak Memory Consumption",
    xaxis_title="Year",
    yaxis_title="Memory Usage (MB)",
    template="plotly_dark",
)

# Explanation for the legend
st.markdown(
    """
    **Legend Explanation:**
    - **X**: Timeout (TO)
    - **O**: Successful run (OK)
    """
)

# Display plots
st.plotly_chart(fig_runtime)
st.plotly_chart(fig_memory)

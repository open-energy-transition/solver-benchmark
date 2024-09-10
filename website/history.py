import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# Load the data
data = pd.read_csv("./pocs/benchmark_results.csv")

st.title("Solver Performance History")

# Find the peak memory usage and average runtime for each solver and benchmark
peak_memory = (
    data.groupby(["Benchmark", "Solver", "Status"])["Memory Usage (MB)"]
    .max()
    .reset_index()
)
average_runtime = (
    data.groupby(["Benchmark", "Solver", "Status"])["Runtime (s)"].mean().reset_index()
)

# Define marker symbols based on status
status_symbols = {
    "TO": "x",  # Timeout gets an "X"
    "ok": "circle",  # Normal execution gets a circle
}

# Runtimes
fig_runtime = go.Figure()

# Add traces with different markers for statuses
for benchmark in average_runtime["Benchmark"].unique():
    subset = average_runtime[average_runtime["Benchmark"] == benchmark]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        fig_runtime.add_trace(
            go.Scatter(
                x=status_subset["Solver"],
                y=status_subset["Runtime (s)"],
                mode="markers",
                name=f"{benchmark} - {status}",
                marker=dict(
                    symbol=symbol,  # Marker shape based on status
                    size=10,
                ),
                text=status_subset["Status"],  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
            )
        )

fig_runtime.update_layout(
    title="Solver Runtime Comparison",
    xaxis_title="Solver Version",
    yaxis_title="Runtime (s)",
    template="plotly_dark",
)

# Memory usage
fig_memory = go.Figure()

# Add traces with different markers for statuses
for benchmark in peak_memory["Benchmark"].unique():
    subset = peak_memory[peak_memory["Benchmark"] == benchmark]
    for status, symbol in status_symbols.items():
        status_subset = subset[subset["Status"] == status]
        fig_memory.add_trace(
            go.Scatter(
                x=status_subset["Solver"],
                y=status_subset["Memory Usage (MB)"],
                mode="markers",
                name=f"{benchmark} - {status}",
                marker=dict(
                    symbol=symbol,  # Marker shape based on status
                    size=10,
                ),
                text=status_subset["Status"],  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
            )
        )

fig_memory.update_layout(
    title="Solver Peak Memory Consumption",
    xaxis_title="Solver Version",
    yaxis_title="Memory Usage (MB)",
    template="plotly_dark",
)

# Display plots
st.plotly_chart(fig_runtime)
st.plotly_chart(fig_memory)

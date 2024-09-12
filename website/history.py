from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
data = pd.read_csv(data_url)

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
        tooltip_text = subset.apply(
            lambda row: f"{row['Benchmark']} - {row['Status']}", axis=1
        )
        fig_runtime.add_trace(
            go.Scatter(
                x=status_subset["Solver"],
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
        tooltip_text = subset.apply(
            lambda row: f"{row['Benchmark']} - {row['Status']}", axis=1
        )
        fig_memory.add_trace(
            go.Scatter(
                x=status_subset["Solver"],
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
    xaxis_title="Solver Version",
    yaxis_title="Memory Usage (MB)",
    template="plotly_dark",
)

st.markdown(
    """
    These plots show the evolution of solver performance over time.

    **Legend:** an **X** represents benchmarks that timed out (TO), while an **O** indicates a successful run (OK).
    """
)
# Display plots
st.plotly_chart(fig_runtime)
st.plotly_chart(fig_memory)

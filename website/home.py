from pathlib import Path

import pandas as pd
import streamlit as st

# internal
from components.home_chart import (
    render_benchmark_chart_for_benchmarks,
    render_benchmark_chart_for_solvers,
    render_benchmark_violin_plot,
)

# Custom CSS for full-width container
st.markdown(
    """
    <style>
    .block-container {
      max-width: 100%;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Title of the app
st.title("Benchmarks")

# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    # Sort by Solver and Solver Version and keep the latest version
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

# Sort the DataFrame by Benchmark and Runtime to ensure logical line connections
df = df.sort_values(by=["Benchmark", "Runtime (s)"])

# Define marker symbols based on status
status_symbols = {
    "TO": "x",  # Timeout gets an "X"
    "ok": "circle",  # Normal execution gets a circle
}

# Add a line of text explaining the plot and the marker symbols
st.markdown(
    """
    **Legend Explanation:**
    - **X**: Timeout (TO)
    - **O**: Successful run (OK)
    """
)

# Render the chart and display it


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

st.plotly_chart(render_benchmark_chart_for_solvers(df))
st.plotly_chart(render_benchmark_chart_for_benchmarks(df))

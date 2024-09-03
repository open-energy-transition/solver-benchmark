import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# Custom CSS
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
data_url = "./pocs/benchmark_results.csv"
df = pd.read_csv(data_url)

# Create a figure for runtime vs peak memory
fig = go.Figure()

# Find the peak memory usage and average runtime for each solver and benchmark
peak_memory = (
    df.groupby(["Benchmark", "Solver"])["Memory Usage (MB)"].max().reset_index()
)
average_runtime = (
    df.groupby(["Benchmark", "Solver"])["Runtime (s)"].mean().reset_index()
)

# Merge the data to have a common DataFrame for plotting
merged_df = pd.merge(peak_memory, average_runtime, on=["Benchmark", "Solver"])

# Add lines for runtime vs peak memory
for solver in merged_df["Solver"].unique():
    subset = merged_df[merged_df["Solver"] == solver]
    fig.add_trace(
        go.Scatter(
            x=subset["Runtime (s)"],
            y=subset["Memory Usage (MB)"],
            mode="lines+markers",
            name=solver,
            text=subset["Benchmark"],  # Tooltip text
            hoverinfo="text+x+y",  # Display tooltip text with x and y values
        )
    )

# Update layout for the plot
fig.update_layout(
    title="Runtime vs Peak Memory Consumption",
    xaxis_title="Runtime (s)",
    yaxis_title="Peak Memory Usage (MB)",
    template="plotly_dark",
    legend_title="Solver",
)

# Show the plot
st.plotly_chart(fig)

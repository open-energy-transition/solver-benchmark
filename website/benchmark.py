import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import yaml
from st_aggrid import AgGrid

# Load the metadata from the YAML file
def load_metadata(yaml_file):
    with open(yaml_file, 'r') as file:
        return yaml.safe_load(file)

# Load the data from the CSV file
data_url = "./pocs/benchmark_results.csv"
df = pd.read_csv(data_url)

# Load benchmark metadata
metadata = load_metadata('website/metadata.yaml')

# Title of the Benchmarks page
st.title("Benchmarks")

# Dropdown to select a benchmark
benchmark_list = df["Benchmark"].unique()
selected_benchmark = st.selectbox("Select a Benchmark", benchmark_list)

# Display metadata for the selected benchmark
if selected_benchmark in metadata:
    st.subheader(f"Metadata for {selected_benchmark}")
    
    # Convert metadata to DataFrame
    metadata_df = pd.DataFrame(metadata[selected_benchmark])

    # Display the DataFrame using ag-Grid
    AgGrid(metadata_df, editable=True, sortable=True, filter=True, height=70)

    # Filter data for the selected benchmark
    benchmark_data = df[df["Benchmark"] == selected_benchmark]

    # Show the "peak memory vs runtime" plot for the selected benchmark
    fig_filtered = go.Figure()

    # Get peak memory usage and runtime for the selected benchmark
    peak_memory = (
        benchmark_data.groupby("Solver")["Memory Usage (MB)"].max().reset_index()
    )
    runtime = benchmark_data[["Solver", "Runtime (s)"]]

    # Merge data to have a common DataFrame for plotting
    merged_df = pd.merge(peak_memory, runtime, on="Solver")

    # Add lines for runtime vs peak memory
    for solver in merged_df["Solver"].unique():
        subset = merged_df[merged_df["Solver"] == solver]
        fig_filtered.add_trace(
            go.Scatter(
                x=subset["Runtime (s)"],
                y=subset["Memory Usage (MB)"],
                mode="lines+markers",
                name=solver,
                text=subset["Solver"],
                hoverinfo="text+x+y",
            )
        )

    fig_filtered.update_layout(
        title=f"Runtime vs Peak Memory Consumption for {selected_benchmark}",
        xaxis_title="Runtime (s)",
        yaxis_title="Peak Memory Usage (MB)",
        template="plotly_dark",
        legend_title="Solver",
    )

    st.plotly_chart(fig_filtered)

else:
    st.write("No metadata available for the selected benchmark.")

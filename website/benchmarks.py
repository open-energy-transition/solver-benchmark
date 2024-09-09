import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import yaml
from st_aggrid import AgGrid
from st_aggrid.grid_options_builder import GridOptionsBuilder


# Load the metadata from the YAML file
def load_metadata(yaml_file):
    with open(yaml_file, "r") as file:
        return yaml.safe_load(file)


# Load the data from the CSV file
data_url = "./pocs/benchmark_results_mean_stddev.csv"
df = pd.read_csv(data_url)

# Load benchmark metadata
metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

# Title of the Benchmarks page
st.title("Benchmarks")
# Dropdown to select a benchmark
benchmark_list = df["Benchmark"].unique()
selected_benchmark = st.selectbox("Select a Benchmark", benchmark_list)

# Display metadata for the selected benchmark
if selected_benchmark in metadata:
    #########
    # Table #
    #########
    st.subheader(f"Metadata for {selected_benchmark}")

    # Convert metadata to DataFrame
    metadata_df = pd.DataFrame.from_dict(
        metadata[selected_benchmark], orient="index", columns=["Value"]
    ).reset_index()
    metadata_df.columns = ["Header", "Value"]

    # Build grid options with custom row height
    gb = GridOptionsBuilder.from_dataframe(metadata_df)

    gb.configure_grid_options(domLayout="autoHeight")

    grid_options = gb.build()

    # Add custom column definitions
    column_defs = [
        {"headerName": "Header", "field": "Header"},
        {
            "headerName": "Value",
            "field": "Value",
            "flex": 1,
            "cellStyle": {"textAlign": "left"},
        },
    ]
    grid_options["columnDefs"] = column_defs

    # Display the transposed DataFrame using ag-Grid
    AgGrid(
        metadata_df,
        editable=True,
        sortable=True,
        filter=True,
        gridOptions=grid_options,
        fit_columns_on_grid_load=True,
    )

    #########
    # Chart #
    #########
    # Filter data for the selected benchmark
    benchmark_data = df[df["Benchmark"] == selected_benchmark]

    # Show the "peak memory vs runtime" plot for the selected benchmark
    fig_filtered = go.Figure()

    # Get peak memory usage and runtime for the selected benchmark
    peak_memory = (
        benchmark_data.groupby("Solver")["Memory Mean (MB)"].max().reset_index()
    )
    xTitle = "Runtime Mean (s)"
    yTitle = "Memory Mean (MB)"
    runtime = benchmark_data[["Solver", xTitle]]

    # Merge data to have a common DataFrame for plotting
    merged_df = pd.merge(peak_memory, runtime, on="Solver")

    # Add lines for runtime vs peak memory
    for solver in merged_df["Solver"].unique():
        subset = merged_df[merged_df["Solver"] == solver]
        fig_filtered.add_trace(
            go.Scatter(
                x=subset[xTitle],
                y=subset[yTitle],
                mode="lines+markers",
                name=solver,
                text=subset["Solver"],
                hoverinfo="text+x+y",
                marker=dict(size=10),
            )
        )

    fig_filtered.update_layout(
        title=f"Runtime vs Peak Memory Consumption for {selected_benchmark}",
        xaxis_title=xTitle,
        yaxis_title="Peak Memory Usage mean (MB)",
        template="plotly_dark",
        legend_title="Solver",
        xaxis=dict(range=[min(merged_df[xTitle]) - 0.5, max(merged_df[xTitle]) + 0.5]),
        yaxis=dict(range=[min(merged_df[yTitle]) - 0.5, max(merged_df[yTitle]) + 0.5]),
    )

    st.plotly_chart(fig_filtered)

else:
    st.write("No metadata available for the selected benchmark.")

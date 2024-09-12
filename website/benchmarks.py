from pathlib import Path

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
data_url = Path(__file__).parent.parent / "results/benchmark_results_mean_stddev.csv"
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
    # Add legend explanation at the bottom of the table
    legend_data = pd.DataFrame({
        "Header": ["Legend Explanation"],
        "Value": ["X: Timeout (TO), O: Successful run (OK)"]
    })

    # Append the legend to the DataFrame
    metadata_df = pd.concat([metadata_df, legend_data], ignore_index=True)

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

    # Define marker symbols based on status
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Normal execution gets a circle
    }

    # Get peak memory usage and runtime for the selected benchmark
    peak_memory = (
        benchmark_data.groupby(["Solver", "Status"])["Memory Mean (MB)"]
        .max()
        .reset_index()
    )
    xTitle = "Runtime Mean (s)"
    yTitle = "Memory Mean (MB)"
    runtime = benchmark_data[["Solver", "Status", xTitle]]

    # Merge data to have a common DataFrame for plotting
    merged_df = pd.merge(peak_memory, runtime, on=["Solver", "Status"])

    # Add traces for runtime vs peak memory with different symbols
    for status, symbol in status_symbols.items():
        status_subset = merged_df[merged_df["Status"] == status]
        for solver in status_subset["Solver"].unique():
            subset = status_subset[status_subset["Solver"] == solver]
            fig_filtered.add_trace(
                go.Scatter(
                    x=round(subset[xTitle], 1),
                    y=round(subset[yTitle]),
                    mode="markers",
                    name=f"{solver} - {status}",
                    marker=dict(
                        symbol=symbol,  # Marker shape based on status
                        size=10,
                    ),
                    text=subset["Solver"],
                    hoverinfo="text+x+y",
                )
            )

    fig_filtered.update_layout(
        title=f"Runtime vs Peak Memory Consumption for {selected_benchmark}",
        xaxis_title=xTitle,
        yaxis_title="Peak Memory Usage mean (MB)",
        template="plotly_dark",
        legend_title="Solver - Status",
        xaxis=dict(range=[min(merged_df[xTitle]) * 0.85, max(merged_df[xTitle]) * 1.1]),
        yaxis=dict(range=[min(merged_df[yTitle]) * 0.85, max(merged_df[yTitle]) * 1.1]),
    )

    st.plotly_chart(fig_filtered)

    st.markdown(
        """
        **Legend Explanation:**
        - **X**: Timeout (TO)
        - **O**: Successful run (OK)
        """
    )
else:
    st.write("No metadata available for the selected benchmark.")

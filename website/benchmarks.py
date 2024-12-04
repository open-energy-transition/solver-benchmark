from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from packaging.version import parse
from st_aggrid import AgGrid
from st_aggrid.grid_options_builder import GridOptionsBuilder

# local
from utils.file_utils import load_benchmark_data, load_metadata


df_mean_stddev = load_benchmark_data("results/benchmark_results_mean_stddev.csv")
df_mean_stddev["Solver Version"] = df_mean_stddev["Solver Version"].apply(parse)
df_mean_stddev = df_mean_stddev.sort_values(
    by=["Solver", "Solver Version"], ascending=[True, False]
)
df_mean_stddev = df_mean_stddev.drop_duplicates(
    subset=["Solver", "Benchmark", "Size"], keep="first"
)


df_result = load_benchmark_data()
df_result["Solver Version"] = df_result["Solver Version"].apply(parse)
df_result = df_result.sort_values(
    by=["Solver", "Solver Version"], ascending=[True, False]
)
df_result = df_result.drop_duplicates(
    subset=["Solver", "Benchmark", "Size"], keep="first"
)

# Load benchmark metadata
metadata = load_metadata("results/metadata.yaml")

# Title of the Benchmarks page
st.title("Benchmarks")

# Dropdown to select a benchmark
benchmark_list = df_mean_stddev["Benchmark"].unique()
selected_benchmark = st.selectbox("Select a Benchmark", benchmark_list)

# Display metadata for the selected benchmark
if selected_benchmark in metadata:
    #########
    # Metadata Table #
    #########
    st.subheader(f"Metadata for {selected_benchmark}")

    # Convert metadata to DataFrame
    metadata_df = pd.DataFrame.from_dict(
        metadata[selected_benchmark], orient="index", columns=["Value"]
    ).reset_index()
    metadata_df.columns = ["Header", "Value"]

    # Remove the row with the header "Sizes"
    metadata_df = metadata_df[metadata_df["Header"] != "Sizes"]

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

    ###############
    # Sizes Table #
    ##############
    st.subheader(f"Sizes for {selected_benchmark}")

    sizes = metadata[selected_benchmark].get("Sizes", [])
    if sizes:
        # Convert sizes to a DataFrame
        sizes_df = pd.DataFrame(sizes)
        sizes_df["Size"] = (
            sizes_df["Spatial resolution"].astype(str)
            + "-"
            + sizes_df["Temporal resolution"].astype(str)
            + "h"
        )

        # Filter the sizes_df to include only sizes present in the results CSV for the selected benchmark
        filtered_results = df_result[df_result["Benchmark"] == selected_benchmark]
        matching_sizes = filtered_results["Size"].unique()
        filtered_sizes_df = sizes_df[sizes_df["Size"].isin(matching_sizes)]

        if not filtered_sizes_df.empty:
            display_sizes_df = filtered_sizes_df.drop(columns=["Size"])

            # Build grid options for the filtered sizes table
            gb_sizes = GridOptionsBuilder.from_dataframe(filtered_sizes_df)
            gb_sizes.configure_grid_options(domLayout="autoHeight")
            grid_options_sizes = gb_sizes.build()

            # Display filtered sizes table using ag-Grid
            AgGrid(
                filtered_sizes_df,
                editable=False,
                sortable=True,
                filter=True,
                gridOptions=grid_options_sizes,
                fit_columns_on_grid_load=True,
            )
        else:
            st.write(
                "No matching size information available for this benchmark in the results."
            )
    else:
        st.write("No size information available for this benchmark.")

    #########
    # Chart #
    #########
    # Filter data for the selected benchmark
    benchmark_data = df_mean_stddev[df_mean_stddev["Benchmark"] == selected_benchmark]
    # Show the "peak memory vs runtime" plot for the selected benchmark
    fig_filtered = go.Figure()

    # Define marker symbols based on status
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Normal execution gets a circle
    }

    # Get peak memory usage and runtime for the selected benchmark
    peak_memory = (
        benchmark_data.groupby(["Solver", "Status"])[["Solver Release Year"]]
        .max()
        .reset_index()
    )
    xTitle = "Runtime Mean (s)"
    yTitle = "Memory Mean (MB)"
    runtime = benchmark_data[["Solver", "Status", "Size", "Benchmark", yTitle, xTitle]]
    # Merge data to have a common DataFrame for plotting
    merged_df = pd.merge(peak_memory, runtime, on=["Solver", "Status"])
    # Add traces for runtime vs peak memory with different symbols
    for status, symbol in status_symbols.items():
        status_subset = merged_df[merged_df["Status"] == status]
        for solver in status_subset["Solver"].unique():
            subset = status_subset[status_subset["Solver"] == solver]
            tooltip_text = subset.apply(
                lambda row: f"Solver: {row['Solver']}<br>Size: {row['Size']}",
                axis=1,
            )

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
                    text=tooltip_text,
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
        **Legend:** an **$\\times$** represents benchmarks that timed out (TO), while an **$\\bullet$** indicates a successful run (OK).
        """
    )

    ##############
    # MIP Table #
    ############
    # Display MIP-specific information only if Technique is MILP
    if metadata[selected_benchmark].get("Technique") == "MILP":
        mip_data = df_result[(df_result["Benchmark"] == selected_benchmark)]
        if not mip_data.empty:
            st.subheader(f"MIP Information for {selected_benchmark}")

            # Keep only the last row for each solver
            mip_table = mip_data.groupby(["Solver", "Size"]).tail(1)[
                ["Solver", "Size", "Max Integrality Violation", "Duality Gap"]
            ]
            gb_mip = GridOptionsBuilder.from_dataframe(mip_table)
            gb_mip.configure_grid_options(domLayout="normal")
            grid_options_mip = gb_mip.build()

            AgGrid(
                mip_table,
                editable=False,
                sortable=True,
                filter=True,
                gridOptions=grid_options_mip,
                fit_columns_on_grid_load=True,
            )

else:
    st.write("No metadata available for the selected benchmark.")

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from st_aggrid import AgGrid
from st_aggrid.grid_options_builder import GridOptionsBuilder


def render_benchmark_scatter_plot(data: pd.DataFrame, metadata, key):
    selected_benchmark = None
    on_select = "rerun"

    try:
        selected_benchmark = (
            st.session_state[key].selection["points"][0]["text"].split("<br>")[0]
        )
        on_select = "ignore"
    except (KeyError, IndexError):
        selected_benchmark = None
        on_select = "rerun"

    fig = go.Figure()

    # Find the peak memory usage and average runtime for each solver and benchmark
    peak_memory = (
        data.groupby(["Benchmark", "Size", "Solver", "Status"])["Memory Usage (MB)"]
        .max()
        .reset_index()
    )
    average_runtime = (
        data.groupby(["Benchmark", "Size", "Solver", "Status"])["Runtime (s)"]
        .mean()
        .reset_index()
    )

    merged_df = pd.merge(
        peak_memory, average_runtime, on=["Benchmark", "Size", "Solver", "Status"]
    )

    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Successful execution gets a circle
    }

    if selected_benchmark:
        filtered_df = merged_df[merged_df["Benchmark"] == selected_benchmark]
    else:
        filtered_df = merged_df

    for solver in filtered_df["Solver"].unique():
        subset = filtered_df[filtered_df["Solver"] == solver]

        marker_symbol = [
            status_symbols.get(status, "circle") for status in subset["Status"]
        ]
        hover_text = subset.apply(
            lambda row: f"{row['Benchmark']}<br>Instance: {row['Size']}",
            axis=1,
        )

        # Add trace for the solver
        fig.add_trace(
            go.Scatter(
                x=round(subset["Runtime (s)"], 1),
                y=round(subset["Memory Usage (MB)"]),
                mode="markers",
                name=solver,
                text=hover_text,  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
                marker=dict(
                    symbol=marker_symbol,
                ),
                showlegend=True,  # Keep the color of the legend intact
                legendgroup=solver,  # Ensure the legend remains per solver
            )
        )

    if selected_benchmark:
        fig_title = "Runtime vs Peak Memory Consumption for " + selected_benchmark
    else:
        fig_title = "Runtime vs Peak Memory Consumption for all Benchmarks"

    # Update layout for the plot
    fig.update_layout(
        title=fig_title,
        xaxis_title="Runtime (s)",
        yaxis_title="Peak Memory Usage (MB)",
        template="plotly_dark",
        legend_title="Solver",
    )

    # Render the figure
    st.plotly_chart(
        fig,
        on_select=on_select,
        selection_mode="points",
        key=key,
    )

    # Add a line of text explaining the plot and the marker symbols
    st.markdown(
        """
        **Legend:** an **$\\times$** represents benchmarks that timed out (TO), while an **$\\bullet$** indicates a successful run (OK).
        """
    )

    # "Show all" button to reset the view
    if selected_benchmark and st.button("Show all"):
        selected_benchmark = None

    # Display metadata for the selected benchmark below the scatter plot
    if selected_benchmark:
        st.write(f"**Metadata for Benchmark: {selected_benchmark}**")

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

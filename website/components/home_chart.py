import pandas as pd
import plotly.graph_objects as go
import streamlit as st


def render_benchmark_scatter_plot(data: pd.DataFrame, key):
    selected_benchmark = None
    on_select = "rerun"

    try:
        selected_benchmark = st.session_state[key].selection["points"][0]["text"]
        on_select = "ignore"
    except (KeyError, IndexError):
        selected_benchmark = None
        on_select = "rerun"

    fig = go.Figure()

    # Find the peak memory usage and average runtime for each solver and benchmark
    # TODO why not use benchmark_results_mean_stddev.csv?
    peak_memory = (
        data.groupby(["Benchmark", "Solver", "Status"])["Memory Usage (MB)"]
        .max()
        .reset_index()
    )
    average_runtime = (
        data.groupby(["Benchmark", "Solver", "Status"])["Runtime (s)"]
        .mean()
        .reset_index()
    )

    merged_df = pd.merge(
        peak_memory, average_runtime, on=["Benchmark", "Solver", "Status"]
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

        # Add trace for the solver
        fig.add_trace(
            go.Scatter(
                x=round(subset["Runtime (s)"], 1),
                y=round(subset["Memory Usage (MB)"]),
                mode="markers",
                name=solver,
                text=subset["Benchmark"],  # Tooltip text
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

    # "Show all" button to reset the view
    if selected_benchmark and st.button("Show all"):
        selected_benchmark = None

    # Display metadata for the selected benchmark below the scatter plot
    if selected_benchmark:
        st.write(f"**Metadata for Benchmark: {selected_benchmark}**")

        # Round Memory Usage to 0 decimal places and Runtime to 1 decimal place
        filtered_data = merged_df[merged_df["Benchmark"] == selected_benchmark].copy()
        filtered_data["Memory Usage (MB)"] = (
            filtered_data["Memory Usage (MB)"].round(0).astype(int)
        )
        filtered_data["Runtime (s)"] = (
            filtered_data["Runtime (s)"]
            .round(1)
            .apply(lambda x: f"{int(x)}" if x.is_integer() else f"{x:.1f}")
        )

        st.table(filtered_data)

import pandas as pd
import plotly.graph_objects as go
import streamlit as st


# TODO this can probably be removed because without lines, this plot looks the same as the one below?
def render_benchmark_chart_for_benchmarks(data: pd.DataFrame) -> go.Figure:
    """
    Render a chart showing runtime vs peak memory consumption with lines connecting benchmarks,
    grouped by Benchmark.

    Args:
        data (pd.DataFrame): The DataFrame containing benchmark data.

    Returns:
        go.Figure: The Plotly figure object.
    """
    # Create a figure for runtime vs peak memory
    fig = go.Figure()

    # Find the peak memory usage and average runtime for each benchmark and status
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

    # Merge the data to have a common DataFrame for plotting
    merged_df = pd.merge(
        peak_memory, average_runtime, on=["Benchmark", "Solver", "Status"]
    )

    # Define marker symbols based on status
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Successful execution gets a circle
    }

    # Add lines for runtime vs peak memory
    for benchmark in merged_df["Benchmark"].unique():
        subset = merged_df[merged_df["Benchmark"] == benchmark]

        # Get the appropriate marker symbol for each status
        marker_symbol = [
            status_symbols.get(status, "circle") for status in subset["Status"]
        ]

        # Create tooltip text combining Solver and Benchmark
        tooltip_text = subset.apply(
            lambda row: f"{row['Solver']} - {row['Benchmark']}", axis=1
        )

        fig.add_trace(
            go.Scatter(
                x=round(subset["Runtime (s)"], 1),
                y=round(subset["Memory Usage (MB)"]),
                mode="markers",
                name=benchmark,
                text=tooltip_text,  # Tooltip text showing Solver and Benchmark
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
                marker=dict(
                    symbol=marker_symbol, size=10
                ),  # Use symbols based on status
            )
        )

    # Update layout for the plot
    fig.update_layout(
        title="Runtime vs Peak Memory Consumption for Benchmarks",
        xaxis_title="Runtime (s)",
        yaxis_title="Peak Memory Usage (MB)",
        template="plotly_dark",
        legend_title="Benchmark",
        legend=dict(
            x=1,  # Position legend at the right
            y=1,  # Align legend vertically at the top
            traceorder="normal",  # Default trace order
            orientation="v",  # Vertical orientation
        ),
    )

    return fig


def render_benchmark_violin_plot(
    data: pd.DataFrame,
    yaxis_title: str,
    yaxis_data: str,
    chart_title: str,
) -> go.Figure:
    """
    Render a violin plot showing the distribution of runtime consumption
    grouped by Solver for all models.

    Args:
        data (pd.DataFrame): The DataFrame containing benchmark data.

    Returns:
        go.Figure: The Plotly violin plot figure object.
    """
    # Create a figure for the violin plot
    fig = go.Figure()

    # Define a list of colors for each solver
    colors = [
        "rgba(255,0,0,0.5)",  # Red
        "rgba(0,255,0,0.4)",  # Green
        "rgba(0,0,255,0.5)",  # Blue
        "rgba(255,0,255,0.5)",  # Purple
        "rgba(0,255,255,0.5)",  # Cyan
        "rgba(255,255,0,0.5)",  # Yellow
    ]

    # Add violin plots for runtime for each solver, with different colors
    for i, solver in enumerate(data["Solver"].unique()):
        fig.add_trace(
            go.Violin(
                x=data["Solver"][data["Solver"] == solver],
                y=data[yaxis_data][data["Solver"] == solver],
                name=f"{solver} Runtime",
                box_visible=True,  # Show box plot inside violin
                line_color=colors[i % len(colors)],  # Assign color from the list
                fillcolor=colors[i % len(colors)],  # Same color for fill
                hoverinfo="x+y+name",
            )
        )

    # Update layout for the violin plot
    fig.update_layout(
        title=chart_title,
        yaxis_title=yaxis_title,
        xaxis_title="Solver",
        template="plotly_dark",
        violinmode="group",  # Group violins by Solver
        legend_title="Solver",
        legend=dict(
            x=1,
            y=1,
            traceorder="normal",
            orientation="v",
        ),
    )

    return fig


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

        # Update marker sizes: selected benchmark has a larger size
        marker_sizes = [
            20 if benchmark == selected_benchmark else 10
            for benchmark in subset["Benchmark"]
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
                    size=marker_sizes,  # Size is larger for the selected benchmark
                ),
                showlegend=True,  # Keep the color of the legend intact
                legendgroup=solver,  # Ensure the legend remains per solver
            )
        )

    # Update layout for the plot
    fig.update_layout(
        title="Runtime vs Peak Memory Consumption for all Solvers and Benchmarks",
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

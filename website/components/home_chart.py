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


def render_benchmark_scatter_plot(data: pd.DataFrame, key="my_scatter") -> go.Figure:
    selected_benchmark = None

    try:
        selected_benchmark = st.session_state[key].selection["points"][0]["text"]
    except (KeyError, IndexError):
        selected_benchmark = None

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

    solver_colors = {
        "scip": "#AB62FA",
        "gurobi": "#EE553B",
        "glpk": "#636EFA",
        "highs": "#00CC96",
    }

    for solver in merged_df["Solver"].unique():
        subset = merged_df[merged_df["Solver"] == solver]

        marker_symbol = [
            status_symbols.get(status, "circle") for status in subset["Status"]
        ]

        # Update marker sizes: selected benchmark has a larger size
        marker_sizes = [
            20 if benchmark == selected_benchmark else 10
            for benchmark in subset["Benchmark"]
        ]

        if selected_benchmark is not None:
            # Grey out other points, but keep the color legend intact
            marker_colors = [
                solver_colors[solver] if benchmark == selected_benchmark else "grey"
                for benchmark in subset["Benchmark"]
            ]
        else:
            # When no benchmark is selected, use default colors
            marker_colors = [solver_colors[solver] for _ in subset["Solver"]]

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
                    color=marker_colors,  # Color based on selection or solver
                ),
                showlegend=True,  # Keep the color of the legend intact
                legendgroup=solver,  # Ensure the legend remains per solver
                marker_color=marker_colors,  # Ensure legend color is based on solver
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

    return fig

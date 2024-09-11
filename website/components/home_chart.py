import pandas as pd
import plotly.graph_objects as go
from utils.number import round_number


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
                x=round_number(subset["Runtime (s)"]),
                y=round_number(subset["Memory Usage (MB)"], 0),
                mode="lines+markers",
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


def render_benchmark_chart_for_solvers(data: pd.DataFrame) -> go.Figure:
    """
    Render a chart showing runtime vs peak memory consumption with lines connecting benchmarks.

    Args:
        data (pd.DataFrame): The DataFrame containing benchmark data.

    Returns:
        go.Figure: The Plotly figure object.
    """
    # Create a figure for runtime vs peak memory
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
    for solver in merged_df["Solver"].unique():
        subset = merged_df[merged_df["Solver"] == solver]

        # Get the appropriate marker symbol for each status
        marker_symbol = [
            status_symbols.get(status, "circle") for status in subset["Status"]
        ]

        fig.add_trace(
            go.Scatter(
                x=round_number(subset["Runtime (s)"]),
                y=round_number(subset["Memory Usage (MB)"], 0),
                mode="lines+markers",
                name=solver,
                text=subset["Benchmark"],  # Tooltip text
                hoverinfo="text+x+y",  # Display tooltip text with x and y values
                marker=dict(
                    symbol=marker_symbol, size=10
                ),  # Use symbols based on status
            )
        )

    # Update layout for the plot
    fig.update_layout(
        title="Runtime vs Peak Memory Consumption for Solvers",
        xaxis_title="Runtime (s)",
        yaxis_title="Peak Memory Usage (MB)",
        template="plotly_dark",
        legend_title="Solver",
    )

    return fig

import random

import pandas as pd
import plotly.graph_objects as go
import plotly.graph_objs as go_obj


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


def render_benchmark_chart_for_solvers(data: pd.DataFrame) -> go.Figure:
    # ref: https://stackoverflow.com/questions/53327572/how-do-i-highlight-an-entire-trace-upon-hover-in-plotly-for-python
    f = go_obj.FigureWidget()
    f.layout.hovermode = "closest"
    f.layout.hoverdistance = -1  # ensures no "gaps" for selecting sparse data
    default_linewidth = 2
    highlighted_linewidth_delta = 2

    # just some traces with random data points
    num_of_traces = 5
    random.seed = 42
    for i in range(num_of_traces):
        y = [random.random() + i / 2 for _ in range(100)]
        trace = go.Scatter(y=y, mode="lines", line={"width": default_linewidth})
        f.add_trace(trace)

    # our custom event handler
    def update_trace(trace, points, selector):
        # this list stores the points which were clicked on
        # in all but one trace they are empty
        if len(points.point_inds) == 0:
            return

        for i, _ in enumerate(f.data):
            f.data[i]["line"]["width"] = (
                default_linewidth
                + highlighted_linewidth_delta * (i == points.trace_index)
            )

    # we need to add the on_click event to each trace separately
    for i in range(len(f.data)):
        f.data[i].on_click(update_trace)

    # let's show the figure
    return f


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
                # Assign color from the list
                line_color=colors[i % len(colors)],
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

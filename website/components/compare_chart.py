import pandas as pd
import plotly.graph_objects as go


def create_comparison_chart(
    solver1_data,
    solver2_data,
    solver1,
    solver2,
    metric_name,
    comparison_type,
    axis_title,
):
    fig = go.Figure()

    # Define marker symbols based on status
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Normal execution gets a circle
    }

    # Create a DataFrame to merge data from both solvers
    merged_data = pd.merge(
        solver1_data, solver2_data, on="Benchmark", suffixes=("_1", "_2")
    )

    # Scatter plot for comparison
    fig.add_trace(
        go.Scatter(
            x=merged_data[f"{metric_name}_1"],
            y=merged_data[f"{metric_name}_2"],
            mode="markers",
            name=f"{comparison_type} Comparison",
            marker=dict(
                color="blue",
                symbol=[
                    status_symbols.get(status, "circle")
                    for status in merged_data["Status_1"]
                ],  # Use symbols based on status
                size=10,
            ),
        )
    )

    # Define axis range for both axes
    min_runtime = min(
        min(merged_data[f"{metric_name}_1"]), min(merged_data[f"{metric_name}_2"])
    )
    max_runtime = max(
        max(merged_data[f"{metric_name}_1"]), max(merged_data[f"{metric_name}_2"])
    )

    # Adding grid lines and labels for the runtime scatter plot
    fig.update_xaxes(
        showgrid=True,
        gridcolor="LightGray",
        gridwidth=0.5,
        range=[min_runtime, max_runtime],
    )
    fig.update_yaxes(
        showgrid=True,
        gridcolor="LightGray",
        gridwidth=0.5,
        range=[min_runtime, max_runtime],
    )

    # Set aspect ratio to ensure equal height and width
    fig.update_layout(
        xaxis=dict(title=f"{solver1} {axis_title}", scaleanchor="y", scaleratio=1),
        yaxis=dict(title=f"{solver2} {axis_title}", scaleanchor="x", scaleratio=1),
        title=f"Comparison of {solver1} and {solver2} {comparison_type}",
        width=600,
        height=600,
        legend_title="Legend",
    )

    r_max_runtime = round(max_runtime)
    g_min_runtime = int(min_runtime)

    fig.update_layout(yaxis_range=[g_min_runtime, r_max_runtime])
    fig.update_layout(xaxis_range=[g_min_runtime, r_max_runtime])
    fig.add_shape(
        type="line",
        x0=g_min_runtime,
        y0=g_min_runtime,
        x1=r_max_runtime,
        y1=r_max_runtime,
    )

    return fig

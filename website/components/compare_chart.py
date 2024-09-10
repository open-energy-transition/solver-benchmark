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

    # Define marker symbols and colors based on status
    status_symbols = {
        ("ok", "ok"): ("circle", "blue"),  # Both OK
        ("ok", "TO"): ("x", "green"),  # Solver 2 TO
        ("TO", "ok"): ("x", "orange"),  # Solver 1 TO
        ("TO", "TO"): ("x", "red"),  # Both TO
    }

    # Create a DataFrame to merge data from both solvers
    merged_data = pd.merge(
        solver1_data, solver2_data, on="Benchmark", suffixes=("_1", "_2")
    )

    # Determine marker symbol and color based on the status of either solver
    merged_data["Symbol"], merged_data["Color"] = zip(
        *[
            status_symbols.get((status_1, status_2), ("circle", "gray"))
            for status_1, status_2 in zip(
                merged_data["Status_1"], merged_data["Status_2"]
            )
        ]
    )

    # Add traces for each status combination
    for status_combination, (symbol, color) in status_symbols.items():
        status_1, status_2 = status_combination
        subset = merged_data[
            (merged_data["Status_1"] == status_1)
            & (merged_data["Status_2"] == status_2)
        ]
        fig.add_trace(
            go.Scatter(
                x=subset[f"{metric_name}_1"],
                y=subset[f"{metric_name}_2"],
                mode="markers",
                name=f"{status_1}-{status_2}",
                marker=dict(
                    color=color,
                    symbol=symbol,
                    size=10,
                ),
            )
        )

    # Define axis range for both axes
    min_metric = min(
        min(merged_data[f"{metric_name}_1"]), min(merged_data[f"{metric_name}_2"])
    )
    max_metric = max(
        max(merged_data[f"{metric_name}_1"]), max(merged_data[f"{metric_name}_2"])
    )

    # Adding grid lines and labels for the scatter plot
    fig.update_xaxes(
        showgrid=True,
        gridcolor="LightGray",
        gridwidth=0.5,
        range=[min_metric, max_metric],
    )
    fig.update_yaxes(
        showgrid=True,
        gridcolor="LightGray",
        gridwidth=0.5,
        range=[min_metric, max_metric],
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

    # Adjust axis ranges and add diagonal line
    r_max_metric = round(max_metric)
    g_min_metric = int(min_metric)

    fig.update_layout(yaxis_range=[g_min_metric, r_max_metric])
    fig.update_layout(xaxis_range=[g_min_metric, r_max_metric])
    fig.add_shape(
        type="line",
        x0=g_min_metric,
        y0=g_min_metric,
        x1=r_max_metric,
        y1=r_max_metric,
    )

    return fig

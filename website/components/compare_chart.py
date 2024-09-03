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

    # Scatter plot for comparison
    fig.add_trace(
        go.Scatter(
            x=solver1_data[metric_name],
            y=solver2_data[metric_name],
            mode="markers",
            name=f"{comparison_type} Comparison",
            marker=dict(color="blue"),
        )
    )

    # Define axis range for both axes
    min_runtime = min(min(solver1_data[metric_name]), min(solver2_data[metric_name]))
    max_runtime = max(max(solver1_data[metric_name]), max(solver2_data[metric_name]))

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

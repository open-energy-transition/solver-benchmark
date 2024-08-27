import plotly.graph_objects as go
import numpy as np


def create_comparison_chart(solver1_data, solver2_data, solver1, solver2):
    fig = go.Figure()

    # Scatter plot for runtime comparison
    fig.add_trace(go.Scatter(
        x=solver1_data["Runtime (s)"],
        y=solver2_data["Runtime (s)"],
        mode='markers',
        name='Runtime Comparison',
        marker=dict(color='blue')
    ))

    # Define axis range for both axes
    min_runtime = min(min(solver1_data["Runtime (s)"]), min(
        solver2_data["Runtime (s)"]))
    max_runtime = max(max(solver1_data["Runtime (s)"]), max(
        solver2_data["Runtime (s)"]))

    # Add line y=x for runtime comparison
    fig.add_trace(go.Scatter(
        x=[min_runtime, max_runtime],
        y=[min_runtime, max_runtime],
        mode='lines',
        name='y=x',
        line=dict(color='red', dash='dash')
    ))

    # Adding grid lines and labels for the runtime scatter plot
    fig.update_xaxes(showgrid=True, gridcolor='LightGray',
                     gridwidth=0.5, range=[min_runtime, max_runtime])
    fig.update_yaxes(showgrid=True, gridcolor='LightGray',
                     gridwidth=0.5, range=[min_runtime, max_runtime])
    fig.update_layout(
        xaxis_title=f"{solver1} Runtime (s)",
        yaxis_title=f"{solver2} Runtime (s)",
        title=f"Comparison of {solver1} and {solver2} Runtimes",
        width=600,  # Fixed width
        height=600,  # Fixed height
        legend_title='Legend'
    )

    # Scatter plot for peak memory comparison (assuming similar data structure)
    fig.add_trace(go.Scatter(
        x=solver1_data["Runtime (s)"], 
        y=solver2_data["Runtime (s)"],
        mode='markers',
        name='Peak Memory Comparison',
        marker=dict(color='green')
    ))

    # Add line y=x for memory comparison
    fig.add_trace(go.Scatter(
        x=[min_runtime, max_runtime],
        y=[min_runtime, max_runtime],
        mode='lines',
        name='y=x (Memory)',
        line=dict(color='orange', dash='dash')
    ))

    # Adding labels and title for the peak memory scatter plot
    fig.update_layout(
        xaxis_title=f"{solver1} Runtime (s)",
        yaxis_title=f"{solver2} Runtime (s)",
        title=f"Comparison of Peak Memory Consumption for {solver1} and {solver2}",
        width=600,
        height=600,
        legend_title='Legend'
    )

    return fig

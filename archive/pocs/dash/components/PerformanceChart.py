import dash
import pandas as pd
import plotly.express as px
from dash import dcc, html
from dash.dependencies import Input, Output

data_url = "./pocs/benchmark_results.csv"
df = pd.read_csv(data_url)


def PerformanceChart():
    return html.Div(
        [
            dcc.Dropdown(
                id="history-solver-dropdown",
                options=[
                    {"label": solver, "value": solver}
                    for solver in df["Solver"].unique()
                ],
                value=df["Solver"].unique()[0],
                style={"marginBottom": "10px", "fontSize": "16px"},
            ),
            dcc.Graph(
                id="history-solver-graph", style={"height": "600px"}
            ),  # Set height of graph
        ],
        style={
            "backgroundColor": "#f9f9f9",
        },
    )


@dash.callback(
    Output("history-solver-graph", "figure"), Input("history-solver-dropdown", "value")
)
def update_history_graph(solver):
    solver_data = df[df["Solver"] == solver]

    # Calculate average runtime for each benchmark
    avg_solver_data = solver_data.groupby("Benchmark", as_index=False)[
        "Runtime (s)"
    ].mean()

    fig = px.line(
        avg_solver_data,
        x="Benchmark",
        y="Runtime (s)",
        labels={"Benchmark": "Benchmark", "Runtime (s)": "Runtime (s)"},
        title="Solver Runtime History",
        template="plotly_white",  # Custom color
    )

    fig.update_layout(
        title={
            "text": "Solver Runtime History",
            "y": 0.9,
            "x": 0.5,
            "xanchor": "center",
            "yanchor": "top",
        },
        xaxis_title="Benchmark",
        yaxis_title="Runtime (s)",
        font=dict(family="Courier New, monospace", size=12, color="red"),
        plot_bgcolor="rgba(0,0,0,0)",  # Transparent background
        paper_bgcolor="rgba(0,0,0,0)",  # Transparent paper background
    )

    return fig

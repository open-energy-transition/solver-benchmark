import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd

data_url = "./pocs/solvers.csv"
df = pd.read_csv(data_url)

def PerformanceChart():
    return html.Div([
        dcc.Dropdown(
            id='history-solver-dropdown',
            options=[{'label': solver, 'value': solver} for solver in df["Solver Name"].unique()],
            value=df["Solver Name"].unique()[0]
        ),
        dcc.Graph(id='history-solver-graph')
    ])

@dash.callback(
    Output('history-solver-graph', 'figure'),
    Input('history-solver-dropdown', 'value')
)
def update_history_graph(solver):
    solver_data = df[df["Solver Name"] == solver]

    fig = px.line(
        solver_data,
        x="Solver Version",
        y="Runtime (mean)",
        labels={'Solver Version': 'Solver Version', 'Runtime (mean)': 'Runtime (mean)'},
        title=f'Solver Runtime History'
    )
    return fig
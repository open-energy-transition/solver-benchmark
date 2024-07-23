import dash
from dash import dcc, html, callback
from dash.dependencies import Input, Output
import pandas as pd
import plotly.express as px

data_url = "./pocs/solvers.csv"
df = pd.read_csv(data_url)

dash.register_page(__name__)

layout = html.Div([
    html.H1("Compare Solvers"),
    dcc.Dropdown(
        id='solver-dropdown',
        options=[{'label': solver, 'value': solver} for solver in df["Solver Name"].unique()],
        value=df["Solver Name"].unique()[0]
    ),
    html.Button('Compare Solvers', id='compare-button', n_clicks=0),
    dcc.Graph(id='solver-graph')
])

@callback(
    Output('solver-graph', 'figure'),
    Input('compare-button', 'n_clicks'),
    Input('solver-dropdown', 'value')
)
def update_graph(n_clicks, solver):
    if n_clicks > 0:
        solver_data = df[df["Solver Name"] == solver]

        fig = px.line(
            solver_data,
            x="Solver Version",
            y="Runtime (mean)",
            labels={'Solver Version': 'Solver Version', 'Runtime (mean)': 'Runtime (mean)'},
            title=f'Solver Runtime by Version'
        )
        return fig
    return {}

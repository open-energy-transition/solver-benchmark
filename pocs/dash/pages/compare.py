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
        id='solver1-dropdown',
        options=[{'label': solver, 'value': solver} for solver in df["Solver Name"].unique()],
        value=df["Solver Name"].unique()[0]
    ),
    dcc.Dropdown(
        id='solver2-dropdown',
        options=[{'label': solver, 'value': solver} for solver in df["Solver Name"].unique()],
        value=df["Solver Name"].unique()[1]
    ),
    html.Button('Compare Solvers', id='compare-button', n_clicks=0),
    dcc.Graph(id='comparison-graph')
])

@callback(
    Output('comparison-graph', 'figure'),
    Input('compare-button', 'n_clicks'),
    Input('solver1-dropdown', 'value'),
    Input('solver2-dropdown', 'value')
)
def update_graph(n_clicks, solver1, solver2):
    if n_clicks > 0:
        solver1_data = df[df["Solver Name"] == solver1]
        solver2_data = df[df["Solver Name"] == solver2]

        fig = px.scatter(
            x=solver1_data["Runtime (mean)"],
            y=solver2_data["Runtime (mean)"],
            labels={'x': f'{solver1} Runtime (mean)', 'y': f'{solver2} Runtime (mean)'},
            title=f'Comparison of {solver1} and {solver2} Runtimes'
        )
        return fig
    return {}

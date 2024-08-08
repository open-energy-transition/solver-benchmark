import dash
from dash import dcc, html, callback
from dash.dependencies import Input, Output
import pandas as pd
import plotly.express as px
from components.CompareChart import CompareChart

data_url = "./pocs/benchmark_results.csv"
df = pd.read_csv(data_url)

dash.register_page(__name__)

layout = html.Div([
    html.H1("Compare Solvers"),
    html.Div(
        [
            dcc.Dropdown(
                id='solver1-dropdown',
                options=[{'label': solver, 'value': solver} for solver in df["Solver"].unique()],
                value=df["Solver"].unique()[0],
                style={'flex': '1'}
            ),
            dcc.Dropdown(
                id='solver2-dropdown',
                options=[{'label': solver, 'value': solver} for solver in df["Solver"].unique()],
                value=df["Solver"].unique()[1],
                style={'flex': '1'}
            )
        ], 
        style={'display': 'flex', 'gap': '10px', 'marginBottom': '10px'}
    ),
    html.Button('Compare Solvers', id='compare-button', style={ 'textAlign': 'right' }, n_clicks=0),
    html.Div(id='comparison-graph-container')
], style={'width': '100%'})

@callback(
    Output('comparison-graph-container', 'children'),
    Input('compare-button', 'n_clicks'),
    Input('solver1-dropdown', 'value'),
    Input('solver2-dropdown', 'value')
)
def update_graph(n_clicks, solver1, solver2):
    if n_clicks > 0:
        return CompareChart(df, solver1, solver2)
    return {}

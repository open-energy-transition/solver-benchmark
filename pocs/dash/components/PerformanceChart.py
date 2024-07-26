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
            value=df["Solver Name"].unique()[0],
            style={
                'marginBottom': '10px',
                'fontSize': '16px'
            }
        ),
        dcc.Graph(id='history-solver-graph', style={'height': '600px'})  # Set height of graph
    ], style={
        'backgroundColor': '#f9f9f9',  
    })

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
        title=f'Solver Runtime History',
        template='plotly_white',  # Custom color
    )

    fig.update_layout(
        title={
            'text': f'Solver Runtime History',
            'y':0.9,
            'x':0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        xaxis_title='Solver Version',
        yaxis_title='Runtime (mean)',
        font=dict(
            family="Courier New, monospace",
            size=12,
            color="red"
        ),
        plot_bgcolor='rgba(0,0,0,0)',  # Transparent background
        paper_bgcolor='rgba(0,0,0,0)',  # Transparent paper background
    )

    return fig
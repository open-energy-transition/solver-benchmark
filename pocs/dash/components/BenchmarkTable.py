from dash import dash_table
import pandas as pd

data_url = "./pocs/solvers.csv"
df = pd.read_csv(data_url)

def BenchmarkTable():
    return dash_table.DataTable(
        columns=[
            {'name': 'Solver Name', 'id': 'Solver Name', 'type': 'text'},
            {'name': 'Solver Version', 'id': 'Solver Version', 'type': 'text'},
            {'name': 'Benchmark Name', 'id': 'Benchmark Name', 'type': 'text'},
            {'name': 'Benchmark Size', 'id': 'Benchmark Size', 'type': 'text'},
            {'name': 'Runtime (mean)', 'id': 'Runtime (mean)', 'type': 'numeric'},
            {'name': 'Runtime (stddev)', 'id': 'Runtime (stddev)', 'type': 'numeric'},
            {'name': 'Memory (mean)', 'id': 'Memory (mean)', 'type': 'numeric'},
            {'name': 'Memory (stddev)', 'id': 'Memory (stddev)', 'type': 'numeric'},
            {'name': 'Cores', 'id': 'Cores', 'type': 'numeric'},
            {'name': 'Feasibility', 'id': 'Feasibility', 'type': 'text'},
            {'name': 'Objective Value', 'id': 'Objective Value', 'type': 'text'}
        ],
        data=df.to_dict('records'),
        filter_action='native',

        style_table={
            'height': 400,
            'overflowY': 'auto',  # Added vertical scroll
        },
        style_data={
            'width': '150px', 'minWidth': '150px', 'maxWidth': '150px',
            'overflow': 'hidden',
            'textOverflow': 'ellipsis',
            'textAlign': 'left',
            'backgroundColor': '#f9f9f9',  # Light background for data cells
            'color': '#333',  # Dark text color
        },
        style_header={
            'backgroundColor': '#4CAF50',  # Green header background
            'fontWeight': 'bold',
            'color': 'white',  # White text color
            'textAlign': 'center',
        },
        style_cell={
            'padding': '5px',  # Padding for cells
        },
        style_data_conditional=[
            {
                'if': {'row_index': 'odd'},
                'backgroundColor': '#f2f2f2'  # Light grey background for odd rows
            },
            {
                'if': {'column_id': 'Runtime (mean)'},
                'color': 'red',  # Red text for Runtime (mean) column
                'fontWeight': 'bold'
            }
        ]
    )
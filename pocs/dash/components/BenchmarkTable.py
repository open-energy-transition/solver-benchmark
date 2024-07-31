from dash import dash_table
import pandas as pd

data_url = "./pocs/benchmark_results.csv"
df = pd.read_csv(data_url)

def BenchmarkTable():
    return dash_table.DataTable(
        columns=[
            {'name': 'Solver', 'id': 'Solver', 'type': 'text'},
            {'name': 'Benchmark Name', 'id': 'Benchmark', 'type': 'text'},
            {'name': 'Runtime (s)', 'id': 'Runtime (s)', 'type': 'numeric'},
            {'name': 'Memory Usage (MB)', 'id': 'Memory Usage (MB)', 'type': 'numeric'}
        ],
        data=df.to_dict('records'),
        filter_action='native',

        page_size=10,  # Number of rows per page
        page_action='native',  # Enable native pagination

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
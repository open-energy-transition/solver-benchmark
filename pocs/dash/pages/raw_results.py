import dash
from dash import html
from components.BenchmarkTable import BenchmarkTable

import pandas as pd

df = pd.read_csv('./pocs/solvers.csv')

dash.register_page(__name__, path='/')

layout = html.Div(
    [
        html.H1("Benchmarks"),
        BenchmarkTable()
    ]
)

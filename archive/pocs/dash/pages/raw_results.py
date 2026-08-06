import dash
import pandas as pd
from components.BenchmarkTable import BenchmarkTable
from dash import html

df = pd.read_csv("./pocs/solvers.csv")

dash.register_page(__name__, path="/")

layout = html.Div([html.H1("Benchmarks"), BenchmarkTable()])

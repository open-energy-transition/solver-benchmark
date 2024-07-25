import dash
from dash import html
import pandas as pd
from components.PerformanceChart import PerformanceChart

data_url = "./pocs/solvers.csv"
df = pd.read_csv(data_url)

dash.register_page(__name__)

layout = html.Div([
    html.H1("Compare Solvers"),
    PerformanceChart()
])

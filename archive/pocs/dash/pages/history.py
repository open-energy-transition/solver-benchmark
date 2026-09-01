import dash
import pandas as pd
from components.PerformanceChart import PerformanceChart
from dash import html

data_url = "./pocs/solvers.csv"
df = pd.read_csv(data_url)

dash.register_page(__name__)

layout = html.Div([html.H1("Compare Solvers"), PerformanceChart()])

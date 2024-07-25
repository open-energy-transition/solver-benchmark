from dash import dcc
import plotly.express as px

def CompareChart(df, solver1, solver2):
    solver1_data = df[df["Solver Name"] == solver1]
    solver2_data = df[df["Solver Name"] == solver2]

    fig = px.scatter(
        x=solver1_data["Runtime (mean)"],
        y=solver2_data["Runtime (mean)"],
        labels={'x': f'{solver1} Runtime (mean)', 'y': f'{solver2} Runtime (mean)'},
        title=f'Comparison of {solver1} and {solver2} Runtimes'
    )
    return dcc.Graph(figure=fig)
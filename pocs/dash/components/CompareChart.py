from dash import dcc
import plotly.express as px

def CompareChart(df, solver1, solver2):
    solver1_data = df[df["Solver Name"] == solver1]
    solver2_data = df[df["Solver Name"] == solver2]

    fig = px.scatter(
        x=solver1_data["Runtime (mean)"],
        y=solver2_data["Runtime (mean)"],
        labels={'x': f'{solver1} Runtime (mean)', 'y': f'{solver2} Runtime (mean)'},
        title=f'Comparison of {solver1} and {solver2} Runtimes',
        template='plotly_dark',  # Dark theme
        color_discrete_sequence=['#1f77b4'],  # Custom color
    )

    fig.update_layout(
        title={
            'text': f'Comparison of {solver1} and {solver2} Runtimes',
            'y':0.9,
            'x':0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        xaxis_title=f'{solver1} Runtime (mean)',
        yaxis_title=f'{solver2} Runtime (mean)',
        font=dict(
            family="Courier New, monospace",
            size=12,
            color="red"
        ),
        plot_bgcolor='rgba(0,0,0,0)',  # Transparent background
        paper_bgcolor='rgba(0,0,0,0)',  # Transparent paper background
    )

    return dcc.Graph(figure=fig)
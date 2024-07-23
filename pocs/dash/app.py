import dash
from dash import Dash, html, dcc

app = Dash(__name__, use_pages=True)

app.layout = html.Div(
    [
        html.Div(
            [
                html.Div(
                    dcc.Link(f"{page['name']}", href=page["relative_path"]),
                    style={
                        'width': '100%',
                        'padding': '5px 10px',
                        'text-decoration': 'none',
                    }
                ) for page in dash.page_registry.values()
            ],
            style={
                'width': '250px',
                'padding': '30px 0'
            }
        ),
        html.Div(
            dash.page_container,
            style={
                'flex': '1',
                'overflow': 'auto',
            }
        ),
    ],
    style={
        'display': 'flex',
    }
)

if __name__ == '__main__':
    app.run(debug=True)
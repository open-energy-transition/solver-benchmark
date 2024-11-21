from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st
from plotly.subplots import make_subplots

from website.components.filter import generate_filtered_metadata
from website.utils.file_utils import load_metadata


def create_subplots(data, y_metric, title):
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Normal execution gets a circle
    }

    figures = [
        px.scatter(
            data,
            x="Spatial Resolution",
            y=y_metric,
            color="Solver",
            symbol="Status",
            symbol_map=status_symbols,
        ),
        px.scatter(
            data,
            x="Num Variables",
            y=y_metric,
            color="Solver",
            symbol="Status",
            symbol_map=status_symbols,
        ),
        px.scatter(
            data,
            x="Num Constraints",
            y=y_metric,
            color="Solver",
            symbol="Status",
            symbol_map=status_symbols,
        ),
    ]

    fig = make_subplots(
        rows=1,
        cols=len(figures),
        subplot_titles=[
            "Spatial Resolution",
            "Num Variables",
            "Num Constraints",
        ],
    )

    # Add traces to subplots
    added_legends = set()  # Keep track of solvers already added to the legend
    for i, figure in enumerate(figures):
        for trace in figure.data:
            # Show legend only if the solver hasn't been added yet
            if trace.name not in added_legends:
                added_legends.add(trace.name)
                trace.showlegend = True
            else:
                trace.showlegend = False

            fig.add_trace(trace, row=1, col=i + 1)

    fig.update_layout(
        height=400,
        width=1200,
        title_text=title,
        showlegend=True,
    )

    fig.update_yaxes(title_text="Run Solver", row=1, col=1)

    return fig


# Title
st.title("OET/BE Solver Benchmark")


# Load benchmark results
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
raw_df = pd.read_csv(data_url)

# Load metadata
metadata = load_metadata("benchmarks/pypsa/metadata.yaml")
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)

if filtered_metadata.empty:
    st.warning("No matching models found. Please adjust your filter selections.")

for benchmark in filtered_metadata["Benchmark Name"].tolist():
    # Enrich the data for the current benchmark
    enriched_data = []
    benchmark_metadata = metadata.get(benchmark)
    if benchmark_metadata:
        for size in benchmark_metadata["Sizes"]:
            size_key = f"{size['Spatial resolution']}-{size['Temporal resolution']}h"
            matching_rows = raw_df[
                (raw_df["Benchmark"] == benchmark) & (raw_df["Size"] == size_key)
            ]
            for _, row in matching_rows.iterrows():
                enriched_data.append(
                    {
                        "Benchmark": row["Benchmark"],
                        "Size": row["Size"],
                        "Solver": row["Solver"],
                        "Runtime (s)": row["Runtime (s)"],
                        "Memory Usage (MB)": row["Memory Usage (MB)"],
                        "Temporal Resolution": size["Temporal resolution"],
                        "Spatial Resolution": size["Spatial resolution"],
                        "Num Constraints": size["N. of constraints"],
                        "Num Variables": size["N. of variables"],
                        "Status": row["Status"],
                    }
                )

        # Create a DataFrame for the enriched data
        enriched_df = pd.DataFrame(enriched_data)

        # Display benchmark-specific title
        st.subheader(f"Scaling Data for {benchmark}-*-24h")

        # Filter and prepare data for plotting
        data = enriched_df[
            [
                "Spatial Resolution",
                "Num Variables",
                "Num Constraints",
                "Runtime (s)",
                "Memory Usage (MB)",
                "Solver",
                "Status",
            ]
        ]

        # Generate runtime subplot
        runtime_fig = create_subplots(
            data,
            "Runtime (s)",
            "Runtime (s) vs Num Clusters / Num Variables / Num Constraints",
        )
        st.plotly_chart(runtime_fig, use_container_width=True)

        # Generate memory usage subplot
        memory_usage_fig = create_subplots(
            data,
            "Memory Usage (MB)",
            "Memory Usage (MB) vs Num Clusters / Num Variables / Num Constraints",
        )
        st.plotly_chart(memory_usage_fig, use_container_width=True)

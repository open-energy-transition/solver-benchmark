from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

from website.components.filter import generate_filtered_metadata
from website.utils.file_utils import load_metadata


def create_subplots(data, y_metric):
    status_symbols = {
        "TO": "x",  # Timeout gets an "X"
        "ok": "circle",  # Normal execution gets a circle
    }

    # Create separate figures for each metric
    fig_spatial_resolution = px.scatter(
        data,
        x="Spatial Resolution",
        y=y_metric,
        color="Solver",
        symbol="Status",
        symbol_map=status_symbols,
        hover_data=["Benchmark", "Size"],
        title="Spatial Resolution",
    )

    fig_num_variables = px.scatter(
        data,
        x="Num Variables",
        y=y_metric,
        color="Solver",
        symbol="Status",
        symbol_map=status_symbols,
        hover_data=["Benchmark", "Size"],
        title="Num Variables",
    )

    fig_num_constraints = px.scatter(
        data,
        x="Num Constraints",
        y=y_metric,
        color="Solver",
        symbol="Status",
        symbol_map=status_symbols,
        hover_data=["Benchmark", "Size"],
        title="Num Constraints",
    )

    # Update layout for each figure
    for fig in [fig_spatial_resolution, fig_num_variables, fig_num_constraints]:
        fig.update_layout(
            height=400,
            width=1200,
            showlegend=True,  # Ensure each chart has its own legend
        )
        fig.update_yaxes(title_text=y_metric)

    return fig_spatial_resolution, fig_num_variables, fig_num_constraints


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
# Aggregate data from all benchmarks
all_enriched_data = []

for benchmark in filtered_metadata["Benchmark Name"].tolist():
    benchmark_metadata = metadata.get(benchmark)
    if benchmark_metadata:
        for size in benchmark_metadata["Sizes"]:
            size_key = f"{size['Spatial resolution']}-{size['Temporal resolution']}h"
            matching_rows = raw_df[
                (raw_df["Benchmark"] == benchmark) & (raw_df["Size"] == size_key)
            ]
            for _, row in matching_rows.iterrows():
                all_enriched_data.append(
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

# Combine enriched data into a single DataFrame
all_enriched_df = pd.DataFrame(all_enriched_data)

if all_enriched_df.empty:
    st.warning("No data available after processing. Please adjust filters or data.")
else:
    # Display overall title
    st.subheader("Scaling Data Across All Benchmarks")
    # Filter and prepare data for plotting
    combined_data = all_enriched_df[
        [
            "Spatial Resolution",
            "Num Variables",
            "Num Constraints",
            "Runtime (s)",
            "Memory Usage (MB)",
            "Solver",
            "Status",
            "Benchmark",
            "Size",
        ]
    ]

    # Generate runtime subplot
    st.markdown("#### Runtime (s)")
    run_time_sr_fig, run_time_nv_fig, run_time_nc_fig = create_subplots(
        combined_data,
        "Runtime (s)",
    )
    st.plotly_chart(run_time_sr_fig, use_container_width=True)
    st.plotly_chart(run_time_nv_fig, use_container_width=True)
    st.plotly_chart(run_time_nc_fig, use_container_width=True)

    # Generate memory usage subplot
    st.markdown("#### Memory Usage (MB)")
    memory_usage_sr_fig, memory_usage_nv_fig, memory_usage_nc_fig = create_subplots(
        combined_data,
        "Memory Usage (MB)",
    )
    st.plotly_chart(memory_usage_sr_fig, use_container_width=True)
    st.plotly_chart(memory_usage_nv_fig, use_container_width=True)
    st.plotly_chart(memory_usage_nc_fig, use_container_width=True)

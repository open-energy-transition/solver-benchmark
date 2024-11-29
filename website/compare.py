from pathlib import Path

import pandas as pd
import streamlit as st
import streamlit_shadcn_ui as ui
from components.compare_chart import create_comparison_chart
from components.filter import generate_filtered_metadata
from packaging.version import parse
from utils.file_utils import load_metadata

metadata = load_metadata("results/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Filter
filtered_metadata = generate_filtered_metadata(metadata_df)

# Load the data
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df["Solver Version"] = df["Solver Version"].apply(parse)
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

st.title("Compare Solvers")

# Get list of unique solvers from the data
solver_list = df["Solver"].unique()
# Set default solvers based on available solver list length
if len(solver_list) > 1:
    default_solver1 = solver_list[0]
    default_solver2 = solver_list[1]
else:
    st.write(
        "Fewer than 2 solvers available for comparison. Please add more solvers to compare."
    )
    st.stop()

# Dropdown to select Solver 1 with default value
solver1 = st.selectbox(
    "Select Solver 1",
    solver_list,
    index=solver_list.tolist().index(default_solver1),
)

solver2 = st.selectbox(
    "Select Solver 2",
    solver_list,
    index=solver_list.tolist().index(default_solver2),
)

if ui.button(
    text="Compare Solvers",
    key="compare_solvers",
    class_name="absolute right-1 -mx-1",
):
    # Filter data for the selected solvers
    solver1_data = df[df["Solver"] == solver1]
    solver2_data = df[df["Solver"] == solver2]

    # Create the scatter plot for runtime comparison
    run_time_fig = create_comparison_chart(
        solver1_data,
        solver2_data,
        solver1,
        solver2,
        metric_name="Runtime (s)",
        axis_title="runtime (s)",
        comparison_type="runtime",
    )

    # Create the scatter plot for peak memory usage comparison
    mem_use_fig = create_comparison_chart(
        solver1_data,
        solver2_data,
        solver1,
        solver2,
        axis_title="peak memory usage (MB)",
        metric_name="Memory Usage (MB)",
        comparison_type="peak memory usage",
        decimal_places=0,
    )

    st.markdown(
        f"""
        The scatter plots below compare runtime and memory consumption of the selected solvers.
        Each point represents a benchmark, and its position relative to the `y = x` line indicates which solver performs better on it.
        For example, benchmarks above the diagonal in the first plot are those where {solver1} is faster than {solver2} and vice versa for those below the diagonal.

        **Legend:** an **$\\times$** represents benchmarks that timed out (TO), while an **$\\bullet$** indicates a successful run (OK).
        """
    )
    # Display the charts
    st.plotly_chart(run_time_fig)
    st.plotly_chart(mem_use_fig)

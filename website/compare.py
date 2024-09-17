from pathlib import Path

import pandas as pd
import streamlit as st
import streamlit_shadcn_ui as ui
import yaml

# local imports
from components.compare_chart import create_comparison_chart


# Load benchmark metadata
def load_metadata(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)

# Create a sidebar for filters
with st.sidebar:
    st.markdown("### Filters")

    # Add select boxes for filtering metadata with default values set to all items
    selected_model_name = st.multiselect(
        "Model Name",
        options=metadata_df["Model name"].unique(),
        default=metadata_df["Model name"].unique(),
    )

    selected_technique = st.multiselect(
        "Technique",
        options=metadata_df["Technique"].unique(),
        default=metadata_df["Technique"].unique(),
    )

    selected_problem_kind = st.multiselect(
        "Kind of Problem",
        options=metadata_df["Kind of problem"].unique(),
        default=metadata_df["Kind of problem"].unique(),
    )

    selected_sectors = st.multiselect(
        "Sectors",
        options=metadata_df["Sectors"].unique(),
        default=metadata_df["Sectors"].unique(),
    )

# Create boolean masks for each condition
mask_model_name = (
    metadata_df["Model name"].isin(selected_model_name) if selected_model_name else True
)
mask_technique = (
    metadata_df["Technique"].isin(selected_technique) if selected_technique else True
)
mask_problem_kind = (
    metadata_df["Kind of problem"].isin(selected_problem_kind)
    if selected_problem_kind
    else True
)
mask_sectors = (
    metadata_df["Sectors"].isin(selected_sectors) if selected_sectors else True
)

filtered_metadata = metadata_df[
    mask_model_name & mask_technique & mask_problem_kind & mask_sectors
]

# Load the data
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

st.title("Compare Solvers")

# Set default solvers
default_solver1 = "gurobi"
default_solver2 = "highs"

# Dropdown to select Solver 1 with default value Gurobi
solver1 = st.selectbox(
    "Select Solver 1",
    df["Solver"].unique(),
    index=df["Solver"].unique().tolist().index(default_solver1),
)

# Dropdown to select Solver 2 with default value Highs
solver2 = st.selectbox(
    "Select Solver 2",
    df["Solver"].unique(),
    index=df["Solver"].unique().tolist().index(default_solver2),
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

from pathlib import Path

import pandas as pd
import streamlit as st
import streamlit_shadcn_ui as ui

# local
from components.compare_chart import create_comparison_chart

# Load the data
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

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

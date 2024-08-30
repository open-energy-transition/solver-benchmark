import pandas as pd
from components.compare_chart import create_comparison_chart
import streamlit as st
import streamlit_shadcn_ui as ui

data_url = "./pocs/benchmark_results.csv"

df = pd.read_csv(data_url)

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver1 = st.selectbox("Select Solver 1", df["Solver"].unique())

# Dropdown to select Solver 2
solver2 = st.selectbox("Select Solver 2", df["Solver"].unique())

if ui.button(
    text="Compare Solvers",
    key="compare_solvers",
    class_name="absolute right-1 -mx-1",
):
    # Filter data for the selected solvers
    solver1_data = df[df["Solver"] == solver1]
    solver2_data = df[df["Solver"] == solver2]
    # Create the scatter plot
    run_time_fig = create_comparison_chart(
        solver1_data,
        solver2_data,
        solver1,
        solver2,
        metric_name="Runtime (s)",
        axis_title="runtime (s)",
        comparison_type="runtime"
    )

    mem_use_fig = create_comparison_chart(
        solver1_data,
        solver2_data,
        solver1,
        solver2,
        axis_title="peak memory usage (MB)",
        metric_name="Memory Usage (MB)",
        comparison_type="peak memory usage"
    )

    st.plotly_chart(run_time_fig)
    st.plotly_chart(mem_use_fig)

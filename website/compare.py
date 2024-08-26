import streamlit as st
import pandas as pd
from components.CompareChart import create_comparison_chart
import streamlit_shadcn_ui as ui

data_url = "./pocs/benchmark_results.csv"

df = pd.read_csv(data_url)

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver1 = st.selectbox("Select Solver 1", df["Solver"].unique())

# Dropdown to select Solver 2
solver2 = st.selectbox("Select Solver 2", df["Solver"].unique())

if ui.button(text="Compare Solvers",
             key="compare_solvers",
             class_name="absolute right-1 -mx-1",
             ):
    # Filter data for the selected solvers
    solver1_data = df[df["Solver"] == solver1]
    solver2_data = df[df["Solver"] == solver2]
    # Create the scatter plot
    fig = create_comparison_chart(solver1_data, solver2_data, solver1, solver2)

    st.pyplot(fig)

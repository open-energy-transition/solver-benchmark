import streamlit as st
import streamlit_shadcn_ui as ui
import pandas as pd
import matplotlib.pyplot as plt

data_url = "./pocs/benchmark_results.csv"

df = pd.read_csv(data_url)

st.title("Solver performance history")

# Dropdown to select Solver 1
solver = st.selectbox("Select Solver", df["Solver"].unique())

if ui.button(text="Show history",
             key="show_history",
             class_name="absolute right-1 -mx-1",
             ):
    # Filter data for the selected solvers
    solver_data = df[df["Solver"] == solver]

    # Group by Benchmark and calculate the mean Runtime
    avg_solver_data = solver_data.groupby("Benchmark", as_index=False)["Runtime (s)"].mean()

    # Create the scatter plot with enhanced style
    fig, ax = plt.subplots(figsize=(8, 8))

    ax.plot(avg_solver_data["Benchmark"], avg_solver_data["Runtime (s)"], marker='o', linestyle='-', color='b', label='Average Runtime')

    ax.set_xlabel("Benchmark", fontsize=12)
    ax.set_ylabel("Runtime (s)", fontsize=12)

    ax.set_title(f"Solver Runtime by Benchmark", fontsize=14, fontweight='bold')
    ax.grid(True, linestyle='--', alpha=0.7) 
    ax.legend()

    st.pyplot(fig)

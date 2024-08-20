import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Custom CSS
st.markdown(
    """
    <style>
    .stButton {
        text-align: right;
    }
    .stButton>button {        
        color: white;
        background-color: #4CAF50;
        border: none;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 12px;
    }
    </style>
    """,
    unsafe_allow_html=True
)

data_url = "./pocs/benchmark_results.csv"

df = pd.read_csv(data_url)

st.title("Solver performance history")

# Dropdown to select Solver 1
solver = st.selectbox("Select Solver", df["Solver"].unique())

if st.button("Show history"):
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
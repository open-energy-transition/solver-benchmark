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

data_url = "./pocs/solvers.csv"

df = pd.read_csv(data_url)

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver = st.selectbox("Select Solver", df["Solver Name"].unique())

if st.button("Compare Solvers"):
    # Filter data for the selected solvers
    solver_data = df[df["Solver Name"] == solver]

    # Create the scatter plot with enhanced style
    fig, ax = plt.subplots(figsize=(8, 8))
    
    ax.plot(solver_data["Solver Version"], solver_data["Runtime (mean)"], marker='o', linestyle='-', color='b', label='Runtime')
    
    ax.set_xlabel("Solver Version", fontsize=12)
    ax.set_ylabel("Runtime (mean)", fontsize=12)
    
    ax.set_title(f"Solver Runtime by Version", fontsize=14, fontweight='bold')
    ax.grid(True, linestyle='--', alpha=0.7)
    ax.legend()

    st.pyplot(fig)
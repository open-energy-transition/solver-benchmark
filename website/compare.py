import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from components.CompareChart import create_comparison_chart

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

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver1 = st.selectbox("Select Solver 1", df["Solver"].unique())

# Dropdown to select Solver 2
solver2 = st.selectbox("Select Solver 2", df["Solver"].unique())

if st.button("Compare Solvers"):
    # Filter data for the selected solvers
    solver1_data = df[df["Solver"] == solver1]
    solver2_data = df[df["Solver"] == solver2]
    # Create the scatter plot
    fig = create_comparison_chart(solver1_data, solver2_data, solver1, solver2)


    st.pyplot(fig)  
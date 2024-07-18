import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

data_url = "./solvers.csv"

df = pd.read_csv(data_url)

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver = st.selectbox("Select Solver", df["Solver Name"].unique())


if st.button("Compare Solvers"):
    # Filter data for the selected solvers
    solver_data = df[df["Solver Name"] == solver]

    # Create the scatter plot
    fig, ax = plt.subplots(figsize=(8, 8))
    
    ax.plot(solver_data["Solver Version"], solver_data["Runtime (mean)"])
    
    ax.set_xlabel("Solver Version")
    ax.set_ylabel("Runtime (mean)")
    
    ax.set_title(f"Solver Runtime by Version")

    st.pyplot(fig)
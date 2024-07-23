import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

data_url = "./pocs/solvers.csv"

df = pd.read_csv(data_url)

st.title("Compare Solvers")

# Dropdown to select Solver 1
solver1 = st.selectbox("Select Solver 1", df["Solver Name"].unique())

# Dropdown to select Solver 2
solver2 = st.selectbox("Select Solver 2", df["Solver Name"].unique())

if st.button("Compare Solvers"):
    # Filter data for the selected solvers
    solver1_data = df[df["Solver Name"] == solver1]
    solver2_data = df[df["Solver Name"] == solver2]

    # Create the scatter plot
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.scatter(solver1_data["Runtime (mean)"], solver2_data["Runtime (mean)"])
    ax.set_xlabel(f"{solver1} Runtime (mean)")
    ax.set_ylabel(f"{solver2} Runtime (mean)")
    ax.set_title(f"Comparison of {solver1} and {solver2} Runtimes")

    st.pyplot(fig)
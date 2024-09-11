from pathlib import Path

import pandas as pd
import streamlit as st

# local
from components.benchmark_table import display_table
from utils.number import round_number

# Custom CSS
st.markdown(
    """
    <style>
    .block-container {
      max-width: 100%;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Benchmarks")

data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"

df = pd.read_csv(data_url)
# Loop through each row and update the 'Salary' column by adding 1000
for index, row in df.iterrows():
    df.at[index, "Objective Value"] = round_number(row["Objective Value"], 2)
    df.at[index, "Runtime (s)"] = round_number(row["Runtime (s)"], 1)
    df.at[index, "Memory Usage (MB)"] = round_number(row["Memory Usage (MB)"], 0)

filtered_df = display_table(df)

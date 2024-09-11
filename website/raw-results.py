from pathlib import Path

import pandas as pd
import streamlit as st

# local
from components.benchmark_table import display_table

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
df = df.round({"Objective Value": 2, "Runtime (s)": 1, "Memory Usage (MB)": 0})


filtered_df = display_table(df)

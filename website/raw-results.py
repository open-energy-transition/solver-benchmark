from pathlib import Path

import pandas as pd
import streamlit as st
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

# Remove the st.dataframe call and use AgGrid directly
filtered_df = display_table(df)

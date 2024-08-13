import pandas as pd
import streamlit as st
from components.BenchmarkTable import display_table

# Custom CSS
st.markdown(
    """
    <style>
    .block-container {
      max-width: 100%;
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.title("Benchmarks")

data_url = "./pocs/solvers.csv"

df = pd.read_csv(data_url)

# Remove the st.dataframe call and use AgGrid directly
filtered_df = display_table(df)
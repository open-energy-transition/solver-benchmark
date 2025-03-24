import pandas as pd
import streamlit as st

# local
from components.benchmark_table import display_table
from components.filter import display_filter_status, generate_filtered_metadata
from utils.file_utils import load_benchmark_data, load_metadata

from website.utils.filters import filter_data

metadata = load_metadata("results/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata["benchmarks"]).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)


# Custom CSS
st.markdown(
    """
    <style>
    .block-container {
      max-width: 100%;
    }

    .st-multiselect {
        background-color: rgba(151, 166, 195, 0.25) !important;
        color: black; /* Text color */
    }
    .st-multiselect select {
        background-color: rgba(151, 166, 195, 0.25) !important;
    }
    .st-multiselect select option {
        background-color: rgba(151, 166, 195, 0.25) !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Benchmarks")

filtered_metadata = generate_filtered_metadata(metadata_df)

# Load the data from the CSV file
df = load_benchmark_data()

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    df = filter_data(df, filtered_metadata)

# Filter status
display_filter_status(df, filtered_metadata)

# Round the DataFrame values
df = df.round({"Objective Value": 2, "Runtime (s)": 1, "Memory Usage (MB)": 0})

# Rename 'Size' to 'Instance'
df = df.rename(columns={"Size": "Instance"})

# Display the filtered table
filtered_df = display_table(df)

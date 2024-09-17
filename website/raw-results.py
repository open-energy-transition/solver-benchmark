from pathlib import Path

import pandas as pd
import streamlit as st
import yaml

# local
from components.benchmark_table import display_table


# Load benchmark metadata
def load_metadata(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


metadata = load_metadata("benchmarks/pypsa/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
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

# Create a sidebar for filters
with st.sidebar:
    st.markdown("### Filters")

    # Add select boxes for filtering metadata with default values set to all items
    selected_model_name = st.multiselect(
        "Model Name",
        options=metadata_df["Model name"].unique(),
        default=metadata_df["Model name"].unique(),
    )

    selected_technique = st.multiselect(
        "Technique",
        options=metadata_df["Technique"].unique(),
        default=metadata_df["Technique"].unique(),
    )

    selected_problem_kind = st.multiselect(
        "Kind of Problem",
        options=metadata_df["Kind of problem"].unique(),
        default=metadata_df["Kind of problem"].unique(),
    )

    selected_sectors = st.multiselect(
        "Sectors",
        options=metadata_df["Sectors"].unique(),
        default=metadata_df["Sectors"].unique(),
    )

# Create boolean masks for each condition
mask_model_name = (
    metadata_df["Model name"].isin(selected_model_name) if selected_model_name else True
)
mask_technique = (
    metadata_df["Technique"].isin(selected_technique) if selected_technique else True
)
mask_problem_kind = (
    metadata_df["Kind of problem"].isin(selected_problem_kind)
    if selected_problem_kind
    else True
)
mask_sectors = (
    metadata_df["Sectors"].isin(selected_sectors) if selected_sectors else True
)

filtered_metadata = metadata_df[
    mask_model_name & mask_technique & mask_problem_kind & mask_sectors
]

# Load the data from the CSV file
data_url = Path(__file__).parent.parent / "results/benchmark_results.csv"
df = pd.read_csv(data_url)

# Ensure we plot the latest version of each solver if there are multiple versions.
if "Solver Version" in df.columns:
    df = df.sort_values(by=["Solver", "Solver Version"], ascending=[True, False])
    df = df.drop_duplicates(subset=["Solver", "Benchmark"], keep="first")

# Filter the benchmark data to match the filtered metadata
if not filtered_metadata.empty:
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks)]

# Round the DataFrame values
df = df.round({"Objective Value": 2, "Runtime (s)": 1, "Memory Usage (MB)": 0})

# Display the filtered table
filtered_df = display_table(df)

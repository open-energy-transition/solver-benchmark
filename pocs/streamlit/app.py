import pandas as pd
from utils.file_utils import load_benchmark_data, load_metadata

import streamlit as st

st.markdown(
    """
  <style>
    .banner-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 10px 15px;
      text-align: center;
      border-radius: 4px;
      height: 56px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;
    }
    .appview-container {
      margin-top: 56px;
    }
    header.st-emotion-cache-12fmjuu {
      top: 56px;
    }
  </style>
  <div class="banner-container">
      <strong>This website is under development. All content is for testing purposes, and is subject to change.</strong>
  </div>
  """,
    unsafe_allow_html=True,
)
pages = [
    st.Page("home.py", title="Home"),
    st.Page("benchmarks.py", title="Benchmark Details"),
    st.Page("compare.py", title="Solver Comparison"),
    st.Page("history.py", title="Solver Performance History"),
    st.Page("scaling.py", title="Solver Scaling"),
    st.Page("raw-results.py", title="Full Results"),
]

metadata = load_metadata("results/metadata.yaml")

# Convert metadata to a DataFrame for easier filtering
metadata_df = pd.DataFrame(metadata).T.reset_index()
metadata_df.rename(columns={"index": "Benchmark Name"}, inplace=True)
# Load the data from the CSV file
data_df = load_benchmark_data()


# Assert that the set of benchmark names in the metadata matches those in the data
csv_benchmarks = set(data_df["Benchmark"].unique())
metadata_benchmarks = set(metadata_df["Benchmark Name"].unique())
# Assertion to check if both sets are the same
assert csv_benchmarks == metadata_benchmarks, (
    f"Mismatch between CSV benchmarks and metadata benchmarks:\n"
    f"In CSV but not metadata: {csv_benchmarks - metadata_benchmarks}\n"
    f"In metadata but not CSV: {metadata_benchmarks - csv_benchmarks}"
)

pg = st.navigation(pages)
pg.run()
import pandas as pd
import streamlit as st
from st_aggrid import AgGrid, GridOptionsBuilder
from st_aggrid.shared import GridUpdateMode

st.title("Benchmarks")

def filter_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    gb = GridOptionsBuilder.from_dataframe(df)
    gb.configure_default_column(editable=True, filter=True)
    gb.configure_selection('multiple', use_checkbox=True)
    gridOptions = gb.build()

    grid_response = AgGrid(
        df,
        gridOptions=gridOptions,
        update_mode=GridUpdateMode.SELECTION_CHANGED | GridUpdateMode.FILTERING_CHANGED,
        fit_columns_on_grid_load=True,
        enable_enterprise_modules=True,
    )

    filtered_df = pd.DataFrame(grid_response['data'])
    return filtered_df

data_url = "./pocs/solvers.csv"

df = pd.read_csv(data_url)

# Remove the st.dataframe call and use AgGrid directly
filtered_df = filter_dataframe(df)

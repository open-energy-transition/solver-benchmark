import pandas as pd
from st_aggrid import AgGrid, GridOptionsBuilder
from st_aggrid.shared import GridUpdateMode

def filter_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    gb = GridOptionsBuilder.from_dataframe(df)
    gb.configure_default_column(editable=True, filter=True)
    gb.configure_selection('multiple', use_checkbox=True)
    
    # Add styling options
    gb.configure_grid_options(domLayout='autoHeight')
    gb.configure_pagination(paginationAutoPageSize=True)
    gb.configure_side_bar()
    gb.configure_default_column(
        resizable=True,
        sortable=True,
        filter=True,
        editable=True,
        floatingFilter=True,
    )
    
    gridOptions = gb.build()

    grid_response = AgGrid(
        df,
        gridOptions=gridOptions,
        update_mode=GridUpdateMode.SELECTION_CHANGED | GridUpdateMode.FILTERING_CHANGED,
        fit_columns_on_grid_load=True,
        enable_enterprise_modules=True,
        theme='alpine',  # You can choose from 'streamlit', 'light', 'dark', 'blue', 'fresh', 'material'
    )

    filtered_df = pd.DataFrame(grid_response['data'])
    return filtered_df

def display_table(df: pd.DataFrame):
    filtered_df = filter_dataframe(df)
    return filtered_df
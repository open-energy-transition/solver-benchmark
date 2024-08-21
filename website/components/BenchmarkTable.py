import pandas as pd
from st_aggrid import AgGrid, GridOptionsBuilder
from st_aggrid.shared import GridUpdateMode


def filter_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    gb = GridOptionsBuilder.from_dataframe(df)
    gb.configure_default_column(editable=True, filter=True)
    gb.configure_selection('multiple', use_checkbox=True)
    gb.configure_grid_options(
        paginationPageSizeSelector=[10, 20, 50, 100],
    )
    # Add styling options
    gb.configure_pagination(paginationAutoPageSize=False, paginationPageSize=10)
    gb.configure_side_bar()
    gb.configure_default_column(
        resizable=True,
        sortable=True,
        filter=True,
        editable=True,
        floatingFilter=True,
    )

    grid_options = gb.build()

    grid_response = AgGrid(
        df,
        height=570,
        gridOptions=grid_options,
        update_mode=GridUpdateMode.SELECTION_CHANGED | GridUpdateMode.FILTERING_CHANGED,
        fit_columns_on_grid_load=True,
        enable_enterprise_modules=True,
        theme='alpine',
    )

    filtered_df = pd.DataFrame(grid_response['data'])
    return filtered_df


def display_table(df: pd.DataFrame):
    filtered_df = filter_dataframe(df)
    return filtered_df

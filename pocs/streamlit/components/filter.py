import streamlit as st


def generate_filtered_metadata(metadata_df):
    # Sidebar with filters
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

        selected_problem_size = st.multiselect(
            "Problem Size",
            options=["XXS", "XS", "S", "M", "L"],
            default=["XXS", "XS", "S", "M", "L"],
        )

    # Apply the filters
    mask_model_name = (
        metadata_df["Model name"].isin(selected_model_name)
        if selected_model_name
        else True
    )
    mask_technique = (
        metadata_df["Technique"].isin(selected_technique)
        if selected_technique
        else True
    )
    mask_problem_kind = (
        metadata_df["Kind of problem"].isin(selected_problem_kind)
        if selected_problem_kind
        else True
    )
    mask_sectors = (
        metadata_df["Sectors"].isin(selected_sectors) if selected_sectors else True
    )

    # Apply filters
    filtered_metadata = metadata_df[
        mask_model_name & mask_technique & mask_problem_kind & mask_sectors
    ]

    # Add selected problem size as a field in every item
    filtered_metadata.loc[:, "Selected Problem Size"] = [selected_problem_size] * len(
        filtered_metadata
    )

    return filtered_metadata


def display_filter_status(df, metadata_df):
    total_benchmarks = len(metadata_df["Benchmark Name"].unique())
    active_benchmarks = len(df["Benchmark"].unique())

    filters_active = total_benchmarks != active_benchmarks

    with st.sidebar:
        if filters_active:
            st.write(
                f"### Filters are active; showing {active_benchmarks}/{total_benchmarks} benchmarks."
            )
        else:
            st.write("### Showing all benchmarks")

    return filters_active

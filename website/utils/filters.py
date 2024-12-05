def filter_data(df, filtered_metadata):
    # Extract selected problem sizes from filtered metadata
    selected_sizes = filtered_metadata["Selected Problem Size"].iloc[0]

    # Define runtime conditions for problem sizes
    size_conditions = {
        "XXS": lambda runtime: runtime <= 10,
        "XS": lambda runtime: 10 < runtime <= 60,
        "S": lambda runtime: 60 < runtime <= 600,
        "M": lambda runtime: 600 < runtime <= 3600,
        "L": lambda runtime: runtime > 3600,
    }

    # Combine conditions based on selected sizes
    runtime_condition = df["Runtime (s)"].apply(
        lambda runtime: any(size_conditions[size](runtime) for size in selected_sizes)
    )

    # Filter df to include only rows meeting the runtime condition
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    df = df[df["Benchmark"].isin(filtered_benchmarks) & runtime_condition]

    return df

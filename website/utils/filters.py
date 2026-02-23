from packaging.version import parse


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

    # Filter to keep only rows for the solver "highs" first
    highs_df = df[df["Solver"] == "highs"].copy()

    # Ensure we consider the latest version of each solver
    if "Solver Version" in highs_df.columns:
        # Ensure all values in "Solver Version" are strings
        highs_df["Solver Version"] = highs_df["Solver Version"].astype(str)

        # Parse solver versions, handling invalid or missing values
        highs_df["Solver Version"] = highs_df["Solver Version"].apply(
            lambda x: parse(x) if x and x.lower() != "nan" else None
        )

        # Sort by Solver, Solver Version (descending), and remove duplicates
        highs_df = highs_df.sort_values(
            by=["Solver", "Solver Version"], ascending=[True, False]
        )
        highs_df = highs_df.drop_duplicates(
            subset=["Solver", "Size", "Benchmark"], keep="first"
        )

    # Create a dictionary to map the highest version of highs runtime for each ("Benchmark", "Size")
    highs_runtime_dict = highs_df.set_index(["Benchmark", "Size"])[
        "Runtime (s)"
    ].to_dict()

    # Add the highs_run_time column to the original df based on the dictionary
    df["highs_run_time"] = df.apply(
        lambda row: highs_runtime_dict.get((row["Benchmark"], row["Size"]), None),
        axis=1,
    )

    # Combine conditions based on highs_run_time
    runtime_condition = df["highs_run_time"].apply(
        lambda runtime: (
            any(size_conditions[size](runtime) for size in selected_sizes)
            if runtime is not None
            else False
        )
    )

    # Filter df to include only rows meeting the runtime condition and filtered benchmarks
    filtered_benchmarks = filtered_metadata["Benchmark Name"].unique()
    filtered_df = df[df["Benchmark"].isin(filtered_benchmarks) & runtime_condition]

    # Drop the temporary highs_run_time column
    filtered_df = filtered_df.drop(columns=["highs_run_time"], errors="ignore")

    return filtered_df

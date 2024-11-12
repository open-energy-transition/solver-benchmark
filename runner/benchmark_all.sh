#!/bin/bash

# Define the path to requirements files, benchmark script, and benchmark config
REQUIREMENTS_PATH="./"
BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARK_CONFIG="./benchmarks/benchmark_config.yaml"

# Initialize index variable for the first run
idx=0

# Ensure micromamba is installed and accessible
if ! command -v micromamba &> /dev/null
then
    echo "micromamba could not be found. Please install micromamba and try again."
    exit 1
fi

# Loop through each requirements file
for req_file in ./runner/requirements-*.txt; do
    year=$(basename "$req_file" | sed -E 's/requirements-(.*)\.txt/\1/')

    echo "Running benchmarks for the year: $year"

    # Define the environment name based on the year
    env_name="benchmark-gen-$year"

    # Create and activate the micromamba environment
    micromamba create -y -n "$env_name" -f "$req_file" -c conda-forge

    # Activate the environment
    eval "$(micromamba shell hook --shell=bash)"
    micromamba activate "$env_name"

    # Install SCIP version based on the year
    if [ "$year" == "2020" ]; then
        micromamba install -y -c conda-forge scip=7.0.1  # SCIP version for 2020
    elif [ "$year" == "2021" ]; then
        micromamba install -y -c conda-forge scip=7.0.3  # SCIP version for 2021
    elif [ "$year" == "2022" ]; then
        micromamba install -y -c conda-forge scip=8.0.3  # SCIP version for 2022
    elif [ "$year" == "2023" ]; then
        micromamba install -y -c conda-forge scip=8.1.0  # SCIP version for 2023
    elif [ "$year" == "2024" ]; then
        micromamba install -y -c conda-forge scip=9.2.0  # SCIP version for 2024
    fi

    # Run the benchmark script with or without override based on the index
    if [ "$idx" -eq 0 ]; then
        python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year"
    else
        python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year" false
    fi

    # Deactivate and remove the micromamba environment
    micromamba deactivate
    micromamba env remove -y -n "$env_name"

    echo "Completed benchmarks for the year: $year"

    # Increment index for subsequent iterations
    idx=$((idx + 1))
done

echo "All benchmarks completed."

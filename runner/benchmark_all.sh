#!/bin/bash

set -euo pipefail

# TODO take these as args
overwrite_results="true"

BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
# BENCHMARK_CONFIG="./benchmarks/benchmark_config.yaml"
BENCHMARK_CONFIG="./benchmarks/tests.yaml"

years=(2020 2021 2022 2023 2024)
idx=0
source "$(conda info --base)/etc/profile.d/conda.sh"  # Ensure conda is initialized

for year in "${years[@]}"; do
    env_name="benchmark-$year"

    # Reuse conda env for year if it already exists, create otherwise
    if conda env list | grep "$env_name"; then
        echo "Conda env $env_name already exists; using this env for $year's benchmarks"
    else
        echo "Creating conda env $env_name..."
        conda env create -f ./runner/envs/benchmark-$year-fixed.yaml -y
    fi

    # Run the benchmark script for the year
    echo "Running benchmarks for the year: $year"
    if [ "$idx" -eq 0 ]; then
        conda run -n "$env_name" python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year" "$overwrite_results"
    else
        conda run -n "$env_name" python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year" false
    fi

    echo "Completed benchmarks for the year: $year"
    idx=$((idx + 1))
done

echo "All benchmarks completed."

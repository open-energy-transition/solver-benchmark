#!/bin/bash

BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARK_CONFIG="./benchmarks/benchmark_config.yaml"

years=(2020 2021 2022 2023 2024)

idx=0

for year in "${years[@]}"; do

    echo "Running benchmarks for the year: $year"

    env_name="env-$year"

    conda create -n "$env_name" python=3.9 -y
    source "$(conda info --base)/etc/profile.d/conda.sh"  # Ensure conda is initialized
    conda activate "$env_name"
    conda install -c conda-forge linopy=0.4.1 requests==2.32.3 -y
    if [ "$year" -eq 2020 ]; then
        conda install -c conda-forge glpk==5.0.0 scip==7.0.2 pyscipopt==3.1.0 -y
    elif [ "$year" -eq 2021 ]; then
        conda install -c conda-forge scip==7.0.3 pyscipopt==3.4.0 -y
    elif [ "$year" -eq 2022 ]; then
        conda install -c conda-forge scip==8.0.3 pyscipopt==4.3.0 -y
    elif [ "$year" -eq 2023 ]; then
        conda install -c conda-forge scip==8.1.0 pyscipopt==4.4.0 highs=1.6.0 -y
    elif [ "$year" -eq 2024 ]; then
        conda install -c conda-forge scip==9.1.1 pyscipopt==5.2.1 highs=1.7.2 -y
    else
        echo "Error: Unsupported year '$year'."
        continue
    fi

    # Run the benchmark script for the year
    if [ "$idx" -eq 0 ]; then
        conda run -n "$env_name" python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year"
    else
        conda run -n "$env_name" python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year" false
    fi

    # Deactivate and remove the environment
    conda deactivate
    conda env remove -n "$env_name" -y

    echo "Completed benchmarks for the year: $year"

    idx=$((idx + 1))
done

echo "All benchmarks completed."

#!/bin/bash

BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARK_CONFIG="./benchmarks/benchmark_config.yaml"

idx=0

for req_file in ./runner/requirements-*.txt; do
    year=$(basename "$req_file" | sed -E 's/requirements-(.*)\.txt/\1/')

    echo "Running benchmarks for the year: $year"

    env_name="env-$year"

    conda create -n "$env_name" python=3.9 -y
    source "$(conda info --base)/etc/profile.d/conda.sh"  # Ensure conda is initialized
    conda activate "$env_name"

    if [ -f "$req_file" ]; then
        pip install --upgrade pip
        pip install -r "$req_file"

        if [ "$year" -eq 2020 ]; then
            conda install -c conda-forge glpk==5.0 scip==7.0.2 pyscipopt==3.1.0 -y
        elif [ "$year" -eq 2021 ]; then
            conda install -c conda-forge scip==7.0.3 pyscipopt==3.4.0 -y
        elif [ "$year" -eq 2022 ]; then
            conda install -c conda-forge scip==8.0.3 pyscipopt==4.3.0 -y
        elif [ "$year" -eq 2023 ]; then
            conda install -c conda-forge scip==8.1.0 pyscipopt==4.4.0 -y
        elif [ "$year" -eq 2024 ]; then
            conda install -c conda-forge scip==9.1.1 pyscipopt==5.2.1 -y
        else
            echo "Error: Unsupported year '$year'. No installation rules defined."
            continue
        fi

        pip install git+https://github.com/PyPSA/linopy.git@40a27f9e7f5d33acd1d256334a1b193899b166ad
    else
        echo "Error: Requirements file $req_file not found."
        conda deactivate
        conda env remove -n "$env_name"  # Cleanup environment
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

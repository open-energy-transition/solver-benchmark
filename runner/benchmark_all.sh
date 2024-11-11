#!/bin/bash

REQUIREMENTS_PATH="./"
BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARK_CONFIG="./benchmarks/benchmark_config.yaml"

idx=0

for req_file in ./runner/requirements-*.txt; do
    year=$(basename "$req_file" | sed -E 's/requirements-(.*)\.txt/\1/')

    echo "Running benchmarks for the year: $year"

    env_dir="env-$year"
    python3 -m venv "$env_dir"
    source "$env_dir/bin/activate"

    if [ -f "$req_file" ]; then
        pip install --upgrade pip
        pip install -r "$req_file"
    else
        echo "Error: Requirements file $req_file not found."
        deactivate
        rm -rf "$env_dir"
        continue
    fi

    if [ "$idx" -eq 0 ]; then
        python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year"
    else
        python "$BENCHMARK_SCRIPT" "$BENCHMARK_CONFIG" "$year" false
    fi

    deactivate
    rm -rf "$env_dir"

    echo "Completed benchmarks for the year: $year"

    idx=$((idx + 1))
done

echo "All benchmarks completed."

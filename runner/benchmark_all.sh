#!/bin/bash

set -euo pipefail

# Parse command line arguments
usage() {
    echo "Usage: $0 [-a] [-y \"<space separated years>\"] <benchmarks yaml file>"
    echo "Runs the solvers from the specified years (default all) on the benchmarks in the given file"
    echo "Options:"
    echo "    -a    Append to the results CSV file instead of overwriting. Default: overwrite"
    echo "    -y    A space separated string of years to run. Default: 2020 2021 2022 2023 2024"
}
overwrite_results="true"
years=(2020 2021 2022 2023 2024)
while getopts "hay:" flag
do
    case ${flag} in
    h)  usage
        exit 0
        ;;
    a)  echo "Append mode selected. The output results CSV file will NOT be overwritten."
        overwrite="false"
        ;;
    y)  IFS=', ' read -r -a years <<< "$OPTARG"
        ;;
    esac
done
shift $(($OPTIND - 1))
if [[ $# -ne 1 ]]; then
    usage
    exit 1
fi

BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARK_CONFIG="$1"

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

# TODO use abs paths

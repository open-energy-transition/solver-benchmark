#!/bin/bash

set -euo pipefail

# Parse command line arguments
usage() {
    echo "Usage: $0 [-a] [-y \"<space separated years>\"] [-r <seconds>] [-u <run_id>] <benchmarks yaml file>"
    echo "Runs the solvers from the specified years (default all) on the benchmarks in the given file"
    echo "Options:"
    echo "    -a    Append to the results CSV file instead of overwriting. Default: overwrite"
    echo "    -y    A space separated string of years to run. Default: 2020 2021 2022 2023 2024 2025"
    echo "    -r    Reference benchmark interval in seconds. Default: 0 (disabled)"
    echo "    -u    Unique run ID to identify this benchmark run. Default: auto-generated"
}
append_results=""
years=(2020 2021 2022 2023 2024 2025)
reference_interval=0  # Default: disabled
run_id=$(date +%Y%m%d_%H%M%S)_$(hostname)  # Default run_id if not provided

while getopts "hay:r:u:" flag
do
    case ${flag} in
    h)  usage
        exit 0
        ;;
    a)  echo "Append mode selected. The output results CSV file will NOT be overwritten."
        append_results="--append"
        ;;
    y)  IFS=', ' read -r -a years <<< "$OPTARG"
        ;;
    r)  reference_interval="$OPTARG"
        echo "Reference benchmark will run every $reference_interval seconds"
        ;;
    u)  run_id="$OPTARG"
        echo "Using provided run ID: $run_id"
        ;;
    esac
done
shift $(($OPTIND - 1))
if [[ $# -ne 1 ]]; then
    usage
    exit 1
fi

BENCHMARK_SCRIPT="./runner/run_benchmarks.py"
BENCHMARKS_FILE="$1"

echo "Starting benchmark run with ID: $run_id"

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
    conda activate "$env_name"
    if [ "$idx" -eq 0 ]; then
        python "$BENCHMARK_SCRIPT" "$BENCHMARKS_FILE" "$year" $append_results --ref_bench_interval "$reference_interval" --run_id "$run_id"
    else
        python "$BENCHMARK_SCRIPT" "$BENCHMARKS_FILE" "$year" --append --ref_bench_interval "$reference_interval" --run_id "$run_id"
    fi
    conda deactivate

    echo "Completed benchmarks for the year: $year"
    idx=$((idx + 1))
done

echo "All benchmarks completed for run ID: $run_id"

# TODO use abs paths

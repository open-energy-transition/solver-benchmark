#!/bin/bash

set -euo pipefail

# Parse command line arguments
usage() {
    echo "Usage: $0 [-a] [-y \"<space separated years>\"] [-r <seconds>] [-u <run_id>] [-s \"<solvers>\"] <benchmarks yaml file>"
    echo "Runs the solvers from the specified years (default all) on the benchmarks in the given file"
    echo "Options:"
    echo "    -a    Append to the results CSV file instead of overwriting. Default: overwrite"
    echo "    -y    A space separated string of years to run. Default: 2020 2021 2022 2023 2024 2025"
    echo "    -r    Reference benchmark interval in seconds. Default: 0 (disabled)"
    echo "    -u    Unique run ID to identify this benchmark run. Default: auto-generated"
    echo "    -s    Space separated list of solvers to run. Default: year-specific defaults"
}
append_results=""
years=(2020 2021 2022 2023 2024 2025)
reference_interval=0  # Default: disabled
run_id=$(date +%Y%m%d_%H%M%S)_$(hostname)  # Default run_id if not provided
solvers_override=""  # Default: use year-specific solver lists

while getopts "hay:r:u:s:" flag
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
    s)  solvers_override="$OPTARG"
        echo "Using solver override: $solvers_override"
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
    if [ "$year" = "tests" ]; then
        env_name="benchmark-tests"
        if conda env list | grep -q "$env_name"; then
            echo "Conda env $env_name already exists; using this env for tests"
        else
            echo "Creating conda env $env_name..."
            time conda env create -q -f ./runner/envs/benchmark-tests-fixed.yaml -y
        fi
        conda activate "$env_name"
    else
        solver_envs=$(python3 -c "
import yaml
config = yaml.safe_load(open('./runner/solvers.yaml'))
for solver, versions in config['solvers'].items():
    for ver, entry in versions.items():
        if str(entry['year']) == '$year':
            print(entry['env'])
" | sort -u)

        for env_name in $solver_envs; do
            if conda env list | grep -q "$env_name"; then
                echo "Conda env $env_name already exists; reusing"
            else
                fixed_yaml="./runner/envs/${env_name}-fixed.yaml"
                loose_yaml="./runner/envs/${env_name}.yaml"
                if [ -f "$fixed_yaml" ]; then
                    echo "Creating conda env $env_name from fixed YAML..."
                    time conda env create -q -f "$fixed_yaml" -y || echo "WARNING: Failed to create env $env_name, skipping"
                elif [ -f "$loose_yaml" ]; then
                    echo "Creating conda env $env_name from loose YAML..."
                    time conda env create -q -f "$loose_yaml" -y || echo "WARNING: Failed to create env $env_name, skipping"
                else
                    echo "WARNING: No YAML found for env $env_name, skipping"
                fi
            fi
        done

        # Activate any solver env so run_benchmarks.py has its dependencies (psutil, requests, etc.)
        # The script switches to the correct per-solver env internally for each solver invocation.
        first_env=$(echo "$solver_envs" | head -1)
        if [ -n "$first_env" ]; then
            conda activate "$first_env"
        else
            echo "WARNING: No solver envs found for year $year, skipping"
            continue
        fi
    fi

    # Run the benchmark script for the year
    echo "Running benchmarks for the year: $year"

    # If --solvers flag was provided, use it; otherwise use year-specific defaults
    if [ -n "${solvers_override}" ]; then
        solver_args="--solvers ${solvers_override}"
        echo "Using solver override: ${solvers_override}"
    else
        solver_args="--solvers gurobi highs-hipo highs-ipm highs scip cbc glpk"
    fi

    # Overwrite results for the first year, append thereafter
    if [ "$idx" -eq 0 ]; then
        # we're running the script with -e, ignoring error with <command> || true so that execution continues if the script fails
        python "$BENCHMARK_SCRIPT" "$BENCHMARKS_FILE" "$year" $append_results --ref_bench_interval "$reference_interval" --run_id "$run_id" $solver_args || true
    else
        python "$BENCHMARK_SCRIPT" "$BENCHMARKS_FILE" "$year" --append --ref_bench_interval "$reference_interval" --run_id "$run_id" $solver_args || true
    fi
    conda deactivate

    echo "Completed benchmarks for the year: $year"
    idx=$((idx + 1))
done

echo "All benchmarks completed for run ID: $run_id"

# TODO use abs paths

import argparse
import os
import subprocess
import sys
from datetime import datetime
from socket import gethostname


def run_command(command):
    """Executes a command and returns its output, raising an error if it fails."""
    print(f"Executing: {' '.join(command)}")
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {' '.join(command)}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        raise


def main():
    """
    Orchestrates running benchmarks across multiple Conda environments for different years.
    """
    parser = argparse.ArgumentParser(
        description="Run benchmarks for multiple years by managing Conda environments.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "benchmarks_yaml_file",
        type=str,
        help="Path to the benchmarks YAML configuration file.",
    )
    parser.add_argument(
        "-a",
        "--append",
        action="store_true",
        help="Append to the results CSV file instead of overwriting.",
    )
    parser.add_argument(
        "-y",
        "--years",
        nargs="+",
        type=int,
        default=[2020, 2021, 2022, 2023, 2024, 2025],
        help="A space-separated list of years to run.",
    )
    parser.add_argument(
        "-r",
        "--ref_bench_interval",
        type=int,
        default=0,
        help="Reference benchmark interval in seconds. 0 to disable.",
    )
    parser.add_argument(
        "-u",
        "--run_id",
        type=str,
        default=f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{gethostname()}",
        help="Unique ID for this benchmark run.",
    )
    parser.add_argument(
        "-s",
        "--solvers",
        nargs="+",
        type=str,
        help="Space-separated list of solvers to run, overriding year-specific defaults.",
    )
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    benchmark_script_path = os.path.join(script_dir, "run_benchmarks.py")

    print(f"Starting benchmark run with ID: {args.run_id}")

    # Get a list of existing conda environments
    try:
        result = run_command(["conda", "env", "list", "--json"])
        existing_envs = {os.path.basename(env) for env in json.loads(result.stdout)["envs"]}
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        print("Could not list Conda environments. Assuming none exist.", file=sys.stderr)
        existing_envs = set()

    for i, year in enumerate(args.years):
        env_name = f"benchmark-{year}"
        print(f"\n--- Processing year: {year} ---")

        # Create conda env for the year if it doesn't exist
        if env_name not in existing_envs:
            print(f"Creating conda env {env_name}...")
            env_yaml_file = os.path.join(script_dir, "envs", f"benchmark-{year}-fixed.yaml")
            if not os.path.exists(env_yaml_file):
                print(f"ERROR: Environment file not found: {env_yaml_file}", file=sys.stderr)
                continue
            try:
                run_command(["conda", "env", "create", "-q", "-f", env_yaml_file, "-y"])
            except subprocess.CalledProcessError:
                print(f"Failed to create environment {env_name}. Skipping year {year}.", file=sys.stderr)
                continue
        else:
            print(f"Conda env {env_name} already exists; using it for {year}'s benchmarks.")

        # Build the command to run the benchmark script
        command = [
            "conda", "run", "-n", env_name,
            "python", benchmark_script_path,
            args.benchmarks_yaml_file,
            str(year),
            "--run_id", args.run_id,
            "--ref_bench_interval", str(args.ref_bench_interval),
        ]

        # Handle solver arguments
        if args.solvers:
            command.extend(["--solvers", *args.solvers])
        else:
            # Default list of solvers if none are provided via override
            command.extend(["--solvers", "gurobi", "highs-hipo", "highs-ipm", "highs", "scip", "cbc", "glpk"])

        # Overwrite results for the first year, append thereafter
        # The --append flag on this script forces append mode for all years.
        if i > 0 or args.append:
            command.append("--append")

        # Run the benchmark script for the year, ignoring failures to continue the loop
        try:
            run_command(command)
        except subprocess.CalledProcessError:
            print(f"Benchmark script failed for year {year}. Continuing to next year.", file=sys.stderr)

        print(f"Completed benchmarks for the year: {year}")

    print(f"\nAll benchmarks completed for run ID: {args.run_id}")


if __name__ == "__main__":
    main()
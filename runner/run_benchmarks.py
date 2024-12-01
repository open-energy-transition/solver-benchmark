import csv
import json
import os
import statistics
import subprocess
import sys
from pathlib import Path

import requests
import yaml


def get_conda_package_versions(solvers, env_name=None):
    try:
        # Base command
        cmd = ["/opt/conda/bin/conda", "list"]

        # Add environment name if provided
        if env_name:
            cmd.extend(["-n", env_name])

        # Run the conda list command
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Parse the output into a dictionary of package versions
        installed_packages = {}
        for line in result.stdout.splitlines():
            if not line.strip() or line.startswith(
                "#"
            ):  # Skip comments and empty lines
                continue
            parts = line.split()
            if len(parts) >= 2:  # Ensure package name and version are present
                installed_packages[parts[0]] = parts[1]

        solver_versions = {}
        for solver in solvers:
            # HiGHS is called highspy, so map that accordingly
            package = "highspy" if solver == "highs" else solver
            solver_versions[solver] = installed_packages.get(package, None)

        return solver_versions

    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing conda command: {e.stderr or str(e)}")


def download_file_from_google_drive(url, dest_path: Path):
    """Download a file from url and save it locally in the specified folder if it doesn't already exist."""
    # Ensure the destination folder exists
    os.makedirs(dest_path.parent, exist_ok=True)

    if os.path.exists(dest_path):
        print(f"File already exists at {dest_path}. Skipping download.")
        return

    print(f"Downloading {url} to {dest_path}...", end="")
    response = requests.get(url)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        f.write(response.content)
    print("done.")


def parse_memory(output):
    line = output.splitlines()[-1]
    if "MaxResidentSetSizeKB=" in line:
        parts = line.strip().split("=")
        max_resident_set_size = parts[-1]
        return float(max_resident_set_size) / 1000  # Convert to MB
    raise ValueError(f"Could not find memory usage in subprocess output:\n{output}")


def write_csv_headers(results_csv, mean_stddev_csv):
    # Initialize CSV files with headers
    with open(results_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "Benchmark",
                "Size",
                "Solver",
                "Solver Version",
                "Solver Release Year",
                "Status",
                "Termination Condition",
                "Runtime (s)",
                "Memory Usage (MB)",
                "Objective Value",
                "Max Integrality Violation",
                "Duality Gap",
            ]
        )

    with open(mean_stddev_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "Benchmark",
                "Size",
                "Solver",
                "Solver Version",
                "Solver Release Year",
                "Status",
                "Termination Condition",
                "Runtime Mean (s)",
                "Runtime StdDev (s)",
                "Memory Mean (MB)",
                "Memory StdDev (MB)",
                "Objective Value",
            ]
        )


def write_csv_row(results_csv, benchmark_name, metrics):
    # NOTE: ensure the order is the same as the headers above
    with open(results_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                benchmark_name,
                metrics["size"],
                metrics["solver"],
                metrics["solver_version"],
                metrics["solver_release_year"],
                metrics["status"],
                metrics["condition"],
                metrics["runtime"],
                metrics["memory"],
                metrics["objective"],
                metrics["max_integrality_violation"],
                metrics["duality_gap"],
            ]
        )


def write_csv_summary_row(mean_stddev_csv, benchmark_name, metrics):
    # NOTE: ensure the order is the same as the headers above
    with open(mean_stddev_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                benchmark_name,
                metrics["size"],
                metrics["solver"],
                metrics["solver_version"],
                metrics["solver_release_year"],
                metrics["status"],
                metrics["condition"],
                metrics["runtime_mean"],
                metrics["runtime_stddev"],
                metrics["memory_mean"],
                metrics["memory_stddev"],
                metrics["objective"],
            ]
        )


def benchmark_solver(input_file, solver_name, timeout):
    command = [
        "/usr/bin/time",
        "--format",
        "MaxResidentSetSizeKB=%M",
        "timeout",
        f"{timeout}s",
        "python",
        Path(__file__).parent / "run_solver.py",
        solver_name,
        input_file,
    ]
    # Run the command and capture the output
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
    )

    memory = parse_memory(result.stderr)
    if result.returncode == 124:
        print("TIMEOUT")
        metrics = {
            "status": "TO",
            "condition": "Timeout",
            "objective": None,
            "runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    elif result.returncode != 0:
        print(
            f"ERROR running solver. Captured output:\n{result.stdout}\n{result.stderr}"
        )
        # Errors are also said to have run for `timeout`s, so that they appear
        # along with timeouts in charts
        metrics = {
            "status": "ER",
            "condition": "Error",
            "objective": None,
            "runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    else:
        metrics = json.loads(result.stdout.splitlines()[-1])

    metrics["memory"] = memory

    return metrics


def main(
    benchmark_yaml_path,
    solvers,
    year=None,
    iterations=1,
    timeout=10,
    override=True,
):
    results = {}

    # Load benchmarks from YAML file
    with open(benchmark_yaml_path, "r") as file:
        benchmarks_info = yaml.safe_load(file)

    # Create results folder `results/` if it doesn't exist
    results_folder = Path(__file__).parent.parent / "results"
    os.makedirs(results_folder, exist_ok=True)

    results_csv = results_folder / "benchmark_results.csv"
    mean_stddev_csv = results_folder / "benchmark_results_mean_stddev.csv"

    # Write headers if overriding or file doesn't exist
    if override or not results_csv.exists() or not mean_stddev_csv.exists():
        write_csv_headers(results_csv, mean_stddev_csv)
    # TODO put the benchmarks in a better place; for now storing in `runner/benchmarks/``
    benchmarks_folder = Path(__file__).parent / "benchmarks/"
    os.makedirs(benchmarks_folder, exist_ok=True)

    solvers_versions = get_conda_package_versions(solvers, f"benchmark-{year}")

    # Preprocess the sizes and make a list of individual benchmark files to run on
    processed_benchmarks = []
    for benchmark_info in benchmarks_info:
        for size in benchmark_info["sizes"]:
            # Determine the file path to use for the benchmark
            if "path" in size:
                benchmark_path = Path(size["path"])
                if not benchmark_path.exists():
                    raise FileNotFoundError(
                        f"File specified in 'path' does not exist: {benchmark_path}"
                    )
            elif "url" in size:
                # TODO support MPS
                benchmark_path = (
                    benchmarks_folder / f'{benchmark_info["name"]}-{size["size"]}.lp'
                )
                download_file_from_google_drive(size["url"], benchmark_path)
            else:
                raise ValueError("No valid 'path' or 'url' found for benchmark entry.")
            processed_benchmarks.append(
                {
                    "name": benchmark_info["name"],
                    "size": size["size"],
                    "path": benchmark_path,
                }
            )

    for benchmark in processed_benchmarks:
        for solver in solvers:
            solver_version = solvers_versions.get(solver)
            if not solver_version:
                print(f"Solver {solver} is not available. Skipping.")
                continue

            metrics = {}
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(
                    f"Running solver {solver} (version {solver_version}) on {benchmark['path']} ({i})..."
                )

                metrics = benchmark_solver(benchmark["path"], solver, timeout)

                metrics["size"] = benchmark["size"]
                metrics["solver"] = solver
                metrics["solver_version"] = solver_version
                metrics["solver_release_year"] = year

                runtimes.append(metrics["runtime"])
                memory_usages.append(metrics["memory"])

                # Write each benchmark result immediately after the measurement
                write_csv_row(results_csv, benchmark["name"], metrics)

                # If solver errors or times out, don't run further iterations
                if metrics["status"] in {"ER", "TO"}:
                    break

            # Calculate mean and standard deviation
            if iterations > 1:
                metrics["runtime_mean"] = statistics.mean(runtimes)
                metrics["runtime_stddev"] = statistics.stdev(runtimes)
                metrics["memory_mean"] = statistics.mean(memory_usages)
                metrics["memory_stddev"] = statistics.stdev(memory_usages)
            else:
                metrics["runtime_mean"] = runtimes[0]
                metrics["runtime_stddev"] = 0
                metrics["memory_mean"] = memory_usages[0]
                metrics["memory_stddev"] = 0

            # Write mean and standard deviation to CSV
            # NOTE: this uses the last iteration's values for status, condition, etc
            write_csv_summary_row(mean_stddev_csv, benchmark["name"], metrics)

            results[(benchmark["name"], benchmark["size"], solver, solver_version)] = (
                metrics
            )
    return results


if __name__ == "__main__":
    # Check for benchmark file argument and optional year and override arguments
    if len(sys.argv) < 3:
        raise ValueError(
            "Usage: python run_benchmarks.py <path_to_benchmarks.yaml> [<year>] [<override>]"
        )
        sys.exit(1)

    benchmark_yaml_path = sys.argv[1]
    year = sys.argv[2] if len(sys.argv) > 2 else None
    override = sys.argv[3].lower() == "true" if len(sys.argv) > 3 else True

    # solvers = ["highs", "glpk"]  # For dev and testing
    solvers = ["highs", "glpk", "scip"]  # For production

    main(benchmark_yaml_path, solvers, year, override=override)
    # Print a message indicating completion
    print("Benchmarking complete.")

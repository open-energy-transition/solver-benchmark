import csv
import json
import os
import statistics
import subprocess
from pathlib import Path

import requests


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
                "Solver",
                "Status",
                "Termination Condition",
                "Objective Value",
                "Runtime (s)",
                "Memory Usage (MB)",
                "Max Integrality Violation",
                "Duality Gap",
            ]
        )

    with open(mean_stddev_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "Benchmark",
                "Solver",
                "Status",
                "Termination Condition",
                "Objective Value",
                "Runtime Mean (s)",
                "Runtime StdDev (s)",
                "Memory Mean (MB)",
                "Memory StdDev (MB)",
            ]
        )


def write_csv_row(results_csv, benchmark_name, solver, metrics):
    # NOTE: ensure the order is the same as the headers above
    with open(results_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                benchmark_name,
                solver,
                metrics["status"],
                metrics["condition"],
                metrics["objective"],
                metrics["runtime"],
                metrics["memory"],
                metrics["max_integrality_violation"],
                metrics["duality_gap"],
            ]
        )


def write_csv_summary_row(mean_stddev_csv, benchmark_name, solver, metrics):
    # NOTE: ensure the order is the same as the headers above
    with open(mean_stddev_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                benchmark_name,
                solver,
                metrics["status"],
                metrics["condition"],
                metrics["objective"],
                metrics["runtime_mean"],
                metrics["runtime_stddev"],
                metrics["memory_mean"],
                metrics["memory_stddev"],
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


def main(benchmark_files_info, solvers, iterations=1, timeout=15 * 60):
    results = {}

    # Create results folder `results/` if it doesn't exist
    results_folder = Path(__file__).parent.parent / "results"
    os.makedirs(results_folder, exist_ok=True)
    results_csv = results_folder / "benchmark_results.csv"
    mean_stddev_csv = results_folder / "benchmark_results_mean_stddev.csv"
    write_csv_headers(results_csv, mean_stddev_csv)

    # TODO put the benchmarks in a better place; for now storing in `runner/benchmarks/``
    benchmarks_folder = Path(__file__).parent / "benchmarks/"
    os.makedirs(benchmarks_folder, exist_ok=True)
    for file_info in benchmark_files_info:
        benchmark_path = benchmarks_folder / file_info["name"]
        download_file_from_google_drive(file_info["url"], benchmark_path)

        for solver in solvers:
            metrics = {}
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(f"Running solver {solver} on {benchmark_path.name} ({i})...")
                metrics = benchmark_solver(benchmark_path, solver, timeout)

                runtimes.append(metrics["runtime"])
                memory_usages.append(metrics["memory"])

                # Write each benchmark result immediately after the measurement
                write_csv_row(results_csv, benchmark_path.stem, solver, metrics)

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
            write_csv_summary_row(mean_stddev_csv, benchmark_path.stem, solver, metrics)

            results[(benchmark_path.stem, solver)] = metrics
    return results


if __name__ == "__main__":
    benchmark_files_info = [
        {
            "name": "pypsa-eur-sec-2-24h.lp",
            "url": "https://drive.usercontent.google.com/download?id=1lSsWnAbF6-x2AGR0wmJRC6oyPVJzoHPX&export=download&authuser=0&confirm=t",
        },
        {
            "name": "pypsa-eur-elec-trex-3-24h.lp",
            "url": "https://drive.usercontent.google.com/download?id=1a4BqDhk-pzj5vkIftJW66GVsCUw9PXEh&export=download&authuser=0&confirm=t",
        },
        {
            "name": "pypsa-eur-elec-op-3-24h.lp",
            "url": "https://drive.usercontent.google.com/download?id=1T9LR92TX8_SRIx55uLqUYDo-MKq3VeVm&export=download&authuser=0&confirm=t",
        },
        {
            "name": "pypsa-eur-elec-op-ucconv-3-24h.lp",
            "url": "https://drive.usercontent.google.com/download?id=1MtfPguzZJ4ifTwJL_OpdPQbky9Xh0M4Y&export=download&authuser=0&confirm=t",
        },
        {
            "name": "pypsa-gas+wind+sol+ely-1-1h.lp",
            "url": "https://drive.usercontent.google.com/download?id=1fEiHuIwIxbkeu-QLuOZV2yeTeH3O1zbm&export=download&authuser=0&confirm=t",
        },
        {
            "name": "pypsa-gas+wind+sol+ely-ucgas-1-1h.lp",
            "url": "https://drive.usercontent.google.com/download?id=11jEBh4ypLqRgnP5DsQ2NkZomU4FjnDRU&export=download&authuser=0&confirm=t",
        },
    ]
    # solvers = ["highs", "glpk"] # For dev and testing
    solvers = ["highs", "glpk", "scip"]  # For production

    main(benchmark_files_info, solvers)

    # Print a message indicating completion
    print("Benchmarking complete.")

import csv
import json
import os
import statistics
import subprocess
from pathlib import Path

import requests


def download_file_from_google_drive(url, dest_path):
    """Download a file from url and save it locally."""
    response = requests.get(url)
    response.raise_for_status()  # Check for request errors

    with open(dest_path, "wb") as f:
        f.write(response.content)
    print(f"File downloaded and saved to: {dest_path}")


def parse_memory(output):
    line = output.splitlines()[-1]
    if "MaxResidentSetSizeKB=" in line:
        parts = line.strip().split("=")
        max_resident_set_size = parts[-1]
        return float(max_resident_set_size) / 1000  # Convert to MB
    raise ValueError(f"Could not find memory usage in subprocess output:\n{output}")


class SolverFailed(Exception):
    pass


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
        metrics = {"status": "TO", "runtime": timeout, "memory": memory}
        return metrics
        # TODO also raise an exception here to prevent retrying
    elif result.returncode != 0:
        print(
            f"ERROR running solver. Captured output:\n{result.stdout}\n{result.stderr}"
        )
        raise SolverFailed()
    metrics = json.loads(result.stdout.splitlines()[-1])
    metrics["memory"] = memory

    return metrics


def main(benchmark_files_info, solvers, iterations=1, timeout=20):
    results = {}
    r_mean_std = {}

    for file_info in benchmark_files_info:
        # TODO put the benchmarks in a better place; for now storing in runner/
        benchmarks_folder = Path(__file__).parent
        benchmark_path = benchmarks_folder / file_info["name"]
        if not os.path.exists(benchmark_path):
            print(f"Starting download {file_info['name']} from: {file_info['url']}")
            download_file_from_google_drive(file_info["url"], benchmark_path)

        for solver in solvers:
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(f"Running solver {solver} on {benchmark_path.name} ({i})...")
                try:
                    metrics = benchmark_solver(benchmark_path, solver, timeout)
                except SolverFailed:
                    break
                # TODO dump all results to CSV here
                runtimes.append(metrics["runtime"])
                memory_usages.append(metrics["memory"])

            # Calculate mean and standard deviation
            runtime_mean = runtime_stddev = memory_mean = memory_stddev = None
            if iterations >= 10 and len(runtimes) > 0:
                runtime_mean = statistics.mean(runtimes)
                runtime_stddev = statistics.stdev(runtimes)
                memory_mean = statistics.mean(memory_usages)
                memory_stddev = statistics.stdev(memory_usages)

            results[(file_info["name"], solver)] = {
                "runtimes": runtimes,
                "memory_usages": memory_usages,
            }
            r_mean_std[(file_info["name"], solver)] = {
                "runtime_mean": runtime_mean,
                "runtime_stddev": runtime_stddev,
                "memory_mean": memory_mean,
                "memory_stddev": memory_stddev,
            }

    return results, r_mean_std


def write_results_to_csv(results, output_file):
    with open(output_file, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Benchmark", "Solver", "Runtime (s)", "Memory Usage (MB)"])

        for (file_path, solver), metrics in results.items():
            for runtime, memory_usage in zip(
                metrics["runtimes"], metrics["memory_usages"]
            ):
                writer.writerow([file_path, solver, runtime, memory_usage])

    print(f"Results successfully written to {output_file}.")


def write_mean_stddev_results_to_csv(results, output_file):
    with open(output_file, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "Benchmark",
                "Solver",
                "Runtime Mean (s)",
                "Runtime StdDev (s)",
                "Memory Mean (MB)",
                "Memory StdDev (MB)",
            ]
        )

        for (file_path, solver), metrics in results.items():
            writer.writerow(
                [
                    file_path,
                    solver,
                    metrics["runtime_mean"],
                    metrics["runtime_stddev"],
                    metrics["memory_mean"],
                    metrics["memory_stddev"],
                ]
            )
    print(f"Mean and standard deviation results successfully written to {output_file}.")


if __name__ == "__main__":
    benchmark_files_info = [
        # {
        #     "name": "pypsa-eur-sec-2-lv1-3h.nc",
        #     "url": "https://drive.usercontent.google.com/download?id=1H0oDfpE82ghD8ILywai-b74ytfeYfY8a&export=download&authuser=0",
        # },
        # {
        #     "name": "pypsa-eur-elec-20-lvopt-3h.nc",
        #     "url": "https://drive.usercontent.google.com/download?id=143Owqp5znOeHGenMyxtSSjOoFzq3VEM7&export=download&authuser=0&confirm=t&uuid=3c0e048e-af28-45c0-9c00-0f11786d5ce9&at=APZUnTW8w3kMlFMcj2B9w22ujIUv%3A1724140207473",
        # },
        {
            "name": "pypsa-eur-elec-20-lv1-3h-op.nc",
            "url": "https://drive.usercontent.google.com/download?id=1xHcVl01Po75pM1OEQ6iXRvoSUHNHw0EL&export=download&authuser=0",
        },
        # {
        #     "name": "pypsa-eur-elec-20-lv1-3h-op-ucconv.nc",
        #     "url": "https://drive.usercontent.google.com/download?id=1qPtdwSKI9Xv3m4d6a5PNwqGbvwn0grwl&export=download&authuser=0",
        # },
        {
            "name": "pypsa-wind+sol+ely-1h-ucwind.nc",
            "url": "https://drive.usercontent.google.com/download?id=1SrFi3qDK6JpUM-pzyyz11c8PzFq74XEO&export=download&authuser=0",
        },
        # {
        #     "name": "pypsa-wind+sol+ely-1h.nc",
        #     "url": "https://drive.usercontent.google.com/download?id=1D0_mo--5r9m46F05hjHpdzGDoV0fbsfd&export=download&authuser=0",
        # },
    ]
    # solvers = ["highs", "glpk"] # For dev and testing
    # solvers = ["highs", "glpk", "scip", "gurobi"]  # For production
    solvers = ["gurobi"]

    results, r_mean_std = main(benchmark_files_info, solvers)
    write_results_to_csv(results, "benchmark_results.csv")
    write_mean_stddev_results_to_csv(
        r_mean_std,
        "benchmark_results_mean_stddev.csv",
    )
    # Print a message indicating completion
    print("Benchmarking complete.")

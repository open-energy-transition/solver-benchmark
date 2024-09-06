import csv
import os
import statistics
import subprocess

import requests

# local
from utils import parse_time


def download_file_from_google_drive(url, dest_folder, dest_filename):
    """Download a file from url and save it locally in the specified folder if it doesn't already exist."""
    # Ensure the destination folder exists
    os.makedirs(dest_folder, exist_ok=True)

    dest_path = os.path.join(dest_folder, dest_filename)

    if os.path.exists(dest_path):
        print(f"File already exists at {dest_path}. Skipping download.")
        return

    response = requests.get(url)
    response.raise_for_status()


def benchmark_solver(input_file, solver_name):
    command = [
        "/usr/bin/time",
        "-v",
        "python",
        "runner/run_solver.py",
        solver_name,
        input_file,
    ]
    # Run the command and capture the output
    result = subprocess.run(command, capture_output=True, text=True)

    # Parse the output for runtime and memory usage
    output = result.stderr
    runtime = None
    memory_usage = None
    for line in output.splitlines():
        print(line)
        if "Elapsed (wall clock) time" in line:
            runtime = parse_time(line.split()[-1])
        if "Maximum resident set size" in line:
            parts = line.strip().split()
            max_resident_set_size = parts[-1]
            memory_usage = float(max_resident_set_size) / 1000  # Convert to MB

    if runtime is None:
        print("Runtime information not found in output.")
    if memory_usage is None:
        print("Memory usage information not found in output.")

    return runtime, memory_usage


def main(benchmark_files_info, solvers, iterations=10):
    results = {}
    r_mean_std = {}
    
    results_csv = "pocs/benchmark_results.csv"
    mean_stddev_csv = "pocs/benchmark_results_mean_stddev.csv"

    # Initialize CSV files with headers
    with open(results_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Benchmark", "Solver", "Runtime (s)", "Memory Usage (MB)"])

    with open(mean_stddev_csv, mode="w", newline="") as file:
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

    dest_folder = "runner/lp_file"
    for file_info in benchmark_files_info:
        dest_filename = file_info.get('name')
        print(f"Starting download {file_info['name']} from: {file_info['url']}")
        download_file_from_google_drive(file_info["url"], dest_folder, dest_filename)

        local_file_path = os.path.join(dest_folder, file_info.get('name'))

        for solver in solvers:
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(f"Running solver ({i}): {solver}")
                runtime, memory_usage = benchmark_solver(local_file_path, solver)
                runtimes.append(runtime)
                memory_usages.append(memory_usage)

                # Write each benchmark result immediately after the measurement
                with open(results_csv, mode="a", newline="") as file:
                    writer = csv.writer(file)
                    writer.writerow([file_info["name"], solver, runtime, memory_usage])

            # Calculate mean and standard deviation
            runtime_mean = statistics.mean(runtimes) if iterations > 1 else runtimes[0]
            runtime_stddev = statistics.stdev(runtimes) if iterations > 1 else 0
            memory_mean = statistics.mean(memory_usages) if iterations > 1 else memory_usages[0]
            memory_stddev = statistics.stdev(memory_usages) if iterations > 1 else 0

            # Write mean and standard deviation to CSV
            with open(mean_stddev_csv, mode="a", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(
                    [
                        file_info["name"],
                        solver,
                        runtime_mean,
                        runtime_stddev,
                        memory_mean,
                        memory_stddev,
                    ]
                )

            results[(file_info["label"], solver)] = {
                "runtimes": runtimes,
                "memory_usages": memory_usages,
            }
            r_mean_std[(file_info["label"], solver)] = {
                "runtime_mean": runtime_mean,
                "runtime_stddev": runtime_stddev,
                "memory_mean": memory_mean,
                "memory_stddev": memory_stddev,
            }

    return results, r_mean_std

if __name__ == "__main__":
    benchmark_files_info = [
        {
            "label": "pypsa-eur-sec-2-lv1-3h",
            "name": "config_1.lp",
            "url": "https://drive.usercontent.google.com/download?id=1H0oDfpE82ghD8ILywai-b74ytfeYfY8a&export=download&authuser=0",
        },
        {
            "label": "pypsa-eur-elec-20-lvopt-3h",
            "name": "config_2.lp",
            "url": "https://drive.usercontent.google.com/download?id=143Owqp5znOeHGenMyxtSSjOoFzq3VEM7&export=download&authuser=0&confirm=t&uuid=3c0e048e-af28-45c0-9c00-0f11786d5ce9&at=APZUnTW8w3kMlFMcj2B9w22ujIUv%3A1724140207473",
        },
        {
            "label": "pypsa-eur-elec-20-lv1-3h-op",
            "name": "config_3.lp",
            "url": "https://drive.usercontent.google.com/download?id=1xHcVl01Po75pM1OEQ6iXRvoSUHNHw0EL&export=download&authuser=0",
        },
        {
            "label": "pypsa-eur-elec-20-lv1-3h-op-ucconv",
            "name": "config_4.lp",
            "url": "https://drive.usercontent.google.com/download?id=1qPtdwSKI9Xv3m4d6a5PNwqGbvwn0grwl&export=download&authuser=0",
        },
        {
            "label": "pypsa-wind+sol+ely-1h-ucwind",
            "name": "problem_5.lp",
            "url": "https://drive.usercontent.google.com/download?id=1SrFi3qDK6JpUM-pzyyz11c8PzFq74XEO&export=download&authuser=0",
        },
        {
            "label": "pypsa-wind+sol+ely-1h",
            "name": "problem_6.lp",
            "url": "https://drive.usercontent.google.com/download?id=1D0_mo--5r9m46F05hjHpdzGDoV0fbsfd&export=download&authuser=0",
        },
    ]
    solvers = ["highs", "glpk"]

    main(benchmark_files_info, solvers)    

    # Print a message indicating completion
    print("Benchmarking complete.")

import subprocess
import csv
import statistics
import requests
import os
# local
from utils import parse_time


def download_file_from_google_drive(url, dest_path):
    """Download a file from url and save it locally."""
    response = requests.get(url)
    response.raise_for_status()  # Check for request errors

    with open(dest_path, 'wb') as f:
        f.write(response.content)
    print(f"File downloaded and saved to: {dest_path}")


def benchmark_solver(input_file, solver_name):
    command = ['/usr/bin/time', '-v', 'python',
               'runner/run_solver.py', solver_name, input_file]
    # Run the command and capture the output
    result = subprocess.run(command, capture_output=True, text=True)

    # Parse the output for runtime and memory usage
    output = result.stderr
    runtime = None
    memory_usage = None
    for line in output.splitlines():
        if "Elapsed (wall clock) time" in line:
            runtime = parse_time(line.split()[-1])
        if "Maximum resident set size" in line:
            parts = line.strip().split()
            max_resident_set_size = parts[-1]
            memory_usage = float(max_resident_set_size) / 1024  # Convert to MB

    if runtime is None:
        print("Runtime information not found in output.")
    if memory_usage is None:
        print("Memory usage information not found in output.")

    return runtime, memory_usage


def main(benchmark_files_info, solvers, iterations=10):
    results = {}
    r_mean_std = {}

    for file_info in benchmark_files_info:
        local_file_path = 'runner/temporary.nc'
        print(f"Starting download {file_info['name']} from: {file_info['url']}")
        download_file_from_google_drive(file_info['url'], local_file_path)

        for solver in solvers:
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(f"Running solver ({i}): {solver}")
                runtime, memory_usage = benchmark_solver(
                    local_file_path, solver)
                runtimes.append(runtime)
                memory_usages.append(memory_usage)
            runtime_mean = runtime_stddev = memory_mean = memory_stddev = None
            # Calculate mean and standard deviation
            if iterations >= 10:
                runtime_mean = statistics.mean(runtimes)
                runtime_stddev = statistics.stdev(runtimes)
                memory_mean = statistics.mean(memory_usages)
                memory_stddev = statistics.stdev(memory_usages)

            results[(file_info['name'], solver)] = {
                'runtimes': runtimes,
                'memory_usages': memory_usages,
            }
            r_mean_std[(file_info['name'], solver)] = {
                'runtime_mean': runtime_mean,
                'runtime_stddev': runtime_stddev,
                'memory_mean': memory_mean,
                'memory_stddev': memory_stddev,
            }

        os.remove(local_file_path)

    return results, r_mean_std


def write_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(
            ['Benchmark', 'Solver', 'Runtime (s)', 'Memory Usage (MB)'])

        for (file_path, solver), metrics in results.items():
            for runtime, memory_usage in zip(metrics['runtimes'], metrics['memory_usages']):
                writer.writerow([file_path, solver, runtime, memory_usage])

    print(f"Results successfully written to {output_file}.")


def write_mean_stddev_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            'Benchmark',
            'Solver',
            'Runtime Mean (s)',
            'Runtime StdDev (s)',
            'Memory Mean (MB)',
            'Memory StdDev (MB)',
        ])

        for (file_path, solver), metrics in results.items():
            writer.writerow([
                file_path,
                solver,
                metrics['runtime_mean'],
                metrics['runtime_stddev'],
                metrics['memory_mean'],
                metrics['memory_stddev']
            ])
    print(f"Mean and standard deviation results successfully written to {output_file}.")


if __name__ == "__main__":
    benchmark_files_info = [
        {
            'name': 'pypsa-eur-tutorial-linopy.nc',
            'url': 'https://drive.usercontent.google.com/download?id=1JezcmnLBM3mLqfpZL1nduy--WmJLMiqm&export=download&authuser=0'
        },
        {
            'name': 'model-energy-products-linopy.nc',
            'url': 'https://drive.usercontent.google.com/download?id=1onnBdnIiJ5-V6-JQsKuRMeDzAmpiV1OM&export=download&authuser=0'
        },
        {
            'name': 'model-energy-electricity-linopy.nc',
            'url': 'https://drive.usercontent.google.com/download?id=18WeMK8PU9JHT3efQpo_SEMzIvM5Mij8b&export=download&authuser=0'
        },
    ]
    solvers = ['highs', 'glpk']

    results, r_mean_std = main(benchmark_files_info, solvers)
    write_results_to_csv(results, 'pocs/benchmark_results.csv')
    write_mean_stddev_results_to_csv(
        r_mean_std,
        "pocs/benchmark_results_mean_stddev.csv",
    )
     # Print a message indicating completion
    print("Benchmarking complete.")

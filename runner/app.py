import time
import tracemalloc
import linopy
import csv
import pypsa
import statistics
import os
from _benchmark import memory_logger


def prepare_model(file_path):
    """Prepare the model outside the benchmarking loop."""
    # Load the pypsa network and create the optimization model
    n = pypsa.Network('runner/' + file_path)
    n.optimize.create_model()

    # Save the model to NetCDF
    linopy_model_path = 'runner/' + file_path.replace(".nc", "-linopy.nc")
    n.model.to_netcdf(linopy_model_path)

    # Load the linopy model
    m = linopy.read_netcdf(linopy_model_path)

    # Get the model size (bytes)
    model_size = os.path.getsize(linopy_model_path)
    # Convert model size to MB
    model_size_mb = model_size / (1024 * 1024)

    return m, model_size_mb


def benchmark_solver(m, solver_name, iterations=10):
    runtimes = []
    memory_usages = []
    max_mem_usages = []

    for _ in range(iterations):
        with memory_logger(max_usage=True) as mem:
            m.solve(solver_name=solver_name)  # Solve the model to measure memory
        max_mem, timestamp = mem.mem_usage
        max_mem_usages.append(max_mem)

        # Measure runtime
        start_time = time.time()
        m.solve(solver_name=solver_name)
        end_time = time.time()

        # Record runtime
        runtimes.append(end_time - start_time)

        # Measure memory usage by tracemalloc
        tracemalloc.start()
        m.solve(solver_name=solver_name)  # Run again for memory measurement
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        # Record memory usage
        memory_usages.append(peak / 10**6)  # Convert to MB

        # Measure memory usage by tracemalloc memory_logger
        with memory_logger(max_usage=True) as mem:
            m.solve(solver_name=solver_name)  # Solve the model to measure memory
        max_mem, timestamp = mem.mem_usage
        max_mem_usages.append(max_mem)

    # Calculate mean and standard deviation
    runtime_mean = runtime_stddev = memory_mean = memory_stddev = None
    if iterations >= 10:
        runtime_mean = statistics.mean(runtimes)
        runtime_stddev = statistics.stdev(runtimes)
        memory_mean = statistics.mean(memory_usages)
        memory_stddev = statistics.stdev(memory_usages)

    results = {
        'runtimes': runtimes,
        'memory_usages': memory_usages,
        'runtime_mean': runtime_mean,
        'runtime_stddev': runtime_stddev,
        'memory_mean': memory_mean,
        'memory_stddev': memory_stddev,
        'max_mem_usages': max_mem_usages
    }
    return results


def main(benchmark_files, solvers):
    results = {}
    r_mean_std = {}

    for file_path in benchmark_files:
        # Prepare the model once for each file
        m, model_size = prepare_model(file_path)

        for solver in solvers:
            benchmark_result = benchmark_solver(m, solver)
            runtimes = benchmark_result['runtimes']
            memory_usages = benchmark_result['memory_usages']
            runtime_mean = benchmark_result['runtime_mean']
            runtime_stddev = benchmark_result['runtime_stddev']
            memory_mean = benchmark_result['memory_mean']
            memory_stddev = benchmark_result['memory_stddev']
            max_mem_usages = benchmark_result['max_mem_usages']

            results[(file_path, solver)] = {
                'runtimes': runtimes,
                'memory_usages': memory_usages,
                'max_mem_usages': max_mem_usages,
                'model_size': [model_size],
            }
            r_mean_std[(file_path, solver)] = {
                'runtime_mean': [runtime_mean],
                'runtime_stddev': [runtime_stddev],
                'memory_mean': [memory_mean],
                'memory_stddev': [memory_stddev],
            }
    return results, r_mean_std


def write_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Benchmark', 'Solver', 'Runtime (s)', 'Memory Usage (MB)'])

        for (file_path, solver), metrics in results.items():
            for runtime, memory_usage in zip(metrics['runtimes'], metrics['memory_usages']):
                writer.writerow([file_path, solver, runtime, memory_usage])


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
            for runtime_mean, runtime_stddev, memory_mean, memory_stddev in zip(
                metrics['runtime_mean'],
                metrics['runtime_stddev'],
                metrics['memory_mean'],
                metrics['memory_stddev'],
            ):
                writer.writerow([
                    file_path,
                    solver,
                    runtime_mean,
                    runtime_stddev,
                    memory_mean, memory_stddev])


def write_benchmark_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            'Benchmark',
            'Solver',
            'Runtime (s)',
            'Memory Usage (MB)',
            'Max Memory Usage (MB)',
            'Model Size (MB)',
            ])

        for (file_path, solver), metrics in results.items():
            for runtime, memory_usage, max_mem, model_size in zip(
                metrics['runtimes'],
                metrics['memory_usages'],
                metrics['max_mem_usages'],
                metrics['model_size'],
            ):
                writer.writerow([
                    file_path,
                    solver,
                    runtime,
                    memory_usage,
                    max_mem,
                    model_size,
                    ])

if __name__ == "__main__":
    benchmark_files = [
        'model-energy-electricity.nc',
        'model-energy-products.nc',
        'pypsa-eur-tutorial.nc',
    ]
    solvers = ['highs', 'glpk']

    results, r_mean_std = main(benchmark_files, solvers)
    write_results_to_csv(results, 'pocs/benchmark_results.csv')
    write_mean_stddev_results_to_csv(
        r_mean_std,
        "pocs/benchmark_results_mean_stddev.csv",
        )
    write_benchmark_to_csv(results, 'pocs/benchmark.csv')

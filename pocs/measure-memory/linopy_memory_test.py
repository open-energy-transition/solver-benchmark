import time
import tracemalloc
from linopy import examples
import csv
import statistics


def prepare_model(n):
    """Prepare the linopy benchmark model based on size n."""
    # Create the linopy benchmark model with size n
    m = examples.benchmark_model(n)
    return m


def benchmark_solver(m, solver_name, iterations=10):
    runtimes = []
    memory_usages = []

    for _ in range(iterations):
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
    }
    return results


def main(benchmark_sizes, solvers):
    results = {}
    r_mean_std = {}

    for n in benchmark_sizes:
        # Prepare the model once for each size
        m = prepare_model(n)

        for solver in solvers:
            benchmark_result = benchmark_solver(m, solver)
            runtimes = benchmark_result['runtimes']
            memory_usages = benchmark_result['memory_usages']
            runtime_mean = benchmark_result['runtime_mean']
            runtime_stddev = benchmark_result['runtime_stddev']
            memory_mean = benchmark_result['memory_mean']
            memory_stddev = benchmark_result['memory_stddev']

            results[(n, solver)] = {
                'runtimes': runtimes,
                'memory_usages': memory_usages,
            }
            r_mean_std[(n, solver)] = {
                'runtime_mean': [runtime_mean],
                'runtime_stddev': [runtime_stddev],
                'memory_mean': [memory_mean],
                'memory_stddev': [memory_stddev],
            }
    return results, r_mean_std


def write_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Model Size', 'Solver', 'Runtime (s)', 'Memory Usage (MB)'])

        for (n, solver), metrics in results.items():
            for runtime, memory_usage in zip(metrics['runtimes'], metrics['memory_usages']):
                writer.writerow([n, solver, runtime, memory_usage])


def write_mean_stddev_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            'Model Size',
            'Solver',
            'Runtime Mean (s)',
            'Runtime StdDev (s)',
            'Memory Mean (MB)',
            'Memory StdDev (MB)',
            ])

        for (n, solver), metrics in results.items():
            for runtime_mean, runtime_stddev, memory_mean, memory_stddev in zip(
                metrics['runtime_mean'],
                metrics['runtime_stddev'],
                metrics['memory_mean'],
                metrics['memory_stddev'],
            ):
                writer.writerow([
                    n,
                    solver,
                    runtime_mean,
                    runtime_stddev,
                    memory_mean, memory_stddev])


if __name__ == "__main__":
    benchmark_sizes = [10, 50, 100]
    solvers = ['highs', 'glpk']

    results, r_mean_std = main(benchmark_sizes, solvers)
    write_results_to_csv(results, 'pocs/benchmark_linopy_memory_test_results.csv')
    write_mean_stddev_results_to_csv(
        r_mean_std,
        "pocs/benchmark_results_mean_stddev_linopy_memory_test.csv",
    )

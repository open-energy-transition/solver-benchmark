import time
import tracemalloc
import linopy
import csv
import pypsa
import statistics


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

        # Measure memory usage
        tracemalloc.start()
        m.solve(solver_name=solver_name)  # Run again for memory measurement
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        # Record memory usage
        memory_usages.append(peak / 10**6)  # Convert to MB    

    # Calculate mean and standard deviation
    runtime_mean, runtime_stddev, memory_mean, memory_stddev = None, None, None, None
    if iterations >= 10:
        runtime_mean = statistics.mean(runtimes)
        runtime_stddev = statistics.stdev(runtimes)
        memory_mean = statistics.mean(memory_usages)
        memory_stddev = statistics.stdev(memory_usages)

    return runtimes, memory_usages, runtime_mean, runtime_stddev, memory_mean, memory_stddev


def main(benchmark_files, solvers):
    results = {}
    meanStdResults = {}

    for file_path in benchmark_files:
        # Prepare the model once for each file
        m = prepare_model(file_path)

        for solver in solvers:
            runtimes, memory_usages, runtime_mean, runtime_stddev, memory_mean, memory_stddev = benchmark_solver(m, solver)
            results[(file_path, solver)] = {
                'runtimes': runtimes,
                'memory_usages': memory_usages,
            }
            meanStdResults[(file_path, solver)] = {
                'runtime_mean': [runtime_mean],
                'runtime_stddev': [runtime_stddev],
                'memory_mean': [memory_mean],
                'memory_stddev': [memory_stddev],
            }
    return results, meanStdResults


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

if __name__ == "__main__":
    benchmark_files = [
        'model-energy-electricity.nc',
        'model-energy-products.nc',
        'pypsa-eur-tutorial.nc',
    ]
    solvers = ['highs', 'glpk']

    results, meanStdResults = main(benchmark_files, solvers)
    write_results_to_csv(results, 'pocs/benchmark_results.csv')
    write_mean_stddev_results_to_csv(
        meanStdResults,
        "pocs/benchmark_results_mean_stddev.csv",
        )

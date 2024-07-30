from pathlib import Path
import time
import tracemalloc
import linopy
import csv
import pypsa

def benchmark_solver(file_path, solver_name, iterations=10):
    runtimes = []
    memory_usages = []

    for _ in range(iterations):
        # Start measuring time and memory
        start_time = time.time()
        tracemalloc.start()
        
        # Convert linopy models
        n = pypsa.Network('pocs/runner/' + file_path)
        n.optimize.create_model()
        n.model.to_netcdf('pocs/runner/' + file_path.replace(".nc", "-linopy.nc"))
        

        # Load the model and solve
        m = linopy.read_netcdf('pocs/runner/' + file_path.replace(".nc", "-linopy.nc"))
        m.solve(solver_name=solver_name)

        # Stop measuring time and memory
        end_time = time.time()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        # Record runtime and memory usage
        runtimes.append(end_time - start_time)
        memory_usages.append(peak / 10**6)  # Convert to MB

    return runtimes, memory_usages

def main(benchmark_files, solvers):
    results = {}

    for file_path in benchmark_files:
        for solver in solvers:
            runtimes, memory_usages = benchmark_solver(file_path, solver)
            results[(file_path, solver)] = {
                'runtimes': runtimes,
                'memory_usages': memory_usages
            }

    return results

def write_results_to_csv(results, output_file):
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Benchmark', 'Solver', 'Runtime (s)', 'Memory Usage (MB)'])

        for (file_path, solver), metrics in results.items():
            for runtime, memory_usage in zip(metrics['runtimes'], metrics['memory_usages']):
                writer.writerow([file_path, solver, runtime, memory_usage])

if __name__ == "__main__":
    benchmark_files = [
        'model-energy-electricity.nc',
        'model-energy-products.nc',
        'pypsa-eur-tutorial.nc',
    ]
    solvers = ['highs', 'glpk']

    results = main(benchmark_files, solvers)
    write_results_to_csv(results, 'pocs/benchmark_results.csv')

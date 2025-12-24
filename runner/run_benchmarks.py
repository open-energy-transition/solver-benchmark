import argparse
import csv
import datetime
import gzip
import json
import os
import re
import shutil
import statistics
import subprocess
import time
from pathlib import Path
from socket import gethostname

import psutil
import requests
import yaml

hostname = gethostname()


def get_conda_package_versions(solvers, env_name=None):
    try:
        # List packages in the conda environment
        cmd = "conda list"
        if env_name:
            cmd += " -n " + env_name
        cmd = ["bash", "-i", "-c", cmd]

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

        # Map solver names to their conda package names
        name_to_pkg = {"highs": "highspy", "cbc": "coin-or-cbc", "xpress": "xpress"}
        solver_versions = {}
        for solver in solvers:
            package = name_to_pkg.get(solver, solver)
            solver_versions[solver] = installed_packages.get(package, None)

        return solver_versions

    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing conda command: {e.stderr or str(e)}")


def download_file_from_google_drive(url, dest_path: Path):
    """Download a file from url and save it locally in the specified folder if it doesn't already exist.
    If the file is gzipped (.gz), it will be unzipped after downloading.
    """
    # Ensure the destination folder exists
    os.makedirs(dest_path.parent, exist_ok=True)

    # If dest_path ends with .gz, prepare for the uncompressed version
    if dest_path.suffix == ".gz":
        uncompressed_dest_path = dest_path.with_suffix("")
    else:
        uncompressed_dest_path = dest_path

    if os.path.exists(uncompressed_dest_path):
        print(f"File already exists at {uncompressed_dest_path}. Skipping download.")
        return

    print(f"Downloading {url} to {dest_path}...", end="")
    response = requests.get(url)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        f.write(response.content)
    print("done.")
    if dest_path.suffix == ".gz":
        print(f"Unzipping {dest_path}...")
        with gzip.open(dest_path, "rb") as gz_file:
            uncompressed_file_path = dest_path.with_suffix("")
            with open(uncompressed_file_path, "wb") as uncompressed_file:
                shutil.copyfileobj(gz_file, uncompressed_file)
        os.remove(dest_path)
        print(f"Unzipped to {uncompressed_file_path}.")


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
                "Reported Runtime (s)",
                "Timeout",
                "Hostname",
                "Run ID",
                "Timestamp",
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
                "Run ID",
                "Timestamp",
            ]
        )


def write_csv_row(results_csv, benchmark_name, metrics, run_id, timestamp):
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
                metrics["reported_runtime"],
                metrics["timeout"],
                hostname,
                run_id,
                timestamp,
            ]
        )


def write_csv_summary_row(mean_stddev_csv, benchmark_name, metrics, run_id, timestamp):
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
                run_id,
                timestamp,
            ]
        )


def benchmark_solver(input_file, solver_name, timeout, solver_version):
    available_memory_bytes = psutil.virtual_memory().available
    memory_limit_bytes = int(available_memory_bytes * 0.95)
    memory_limit_mb = memory_limit_bytes / (1024 * 1024)
    print(f"Setting memory limit to {memory_limit_mb:.2f} MB (95% of available memory)")

    command = ["systemd-run"]

    if os.geteuid() != 0:
        command.append("--user")

    command.extend(
        [
            "--scope",
            f"--property=MemoryMax={memory_limit_bytes}",  # Set resident memory limit
            "--property=MemorySwapMax=0",  # Disable swap to ensure only physical RAM is used
            "/usr/bin/time",
            "--format",
            "MaxResidentSetSizeKB=%M",
            "timeout",
            f"{timeout}s",
            "python",
            f"{Path(__file__).parent / 'run_solver.py'}",
            solver_name,
            input_file,
            solver_version,
        ]
    )

    # Run the command and capture the output
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
    )

    memory = None
    try:
        memory = parse_memory(result.stderr)
    except ValueError:
        print("Failed to parse memory usage from stderr")

    if result.returncode == 124:
        print("TIMEOUT")
        metrics = {
            "status": "TO",
            "condition": "Timeout",
            "objective": None,
            "runtime": timeout,
            "reported_runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    # systemd-run uses sigkill (9) or sigterm (15) to terminate the process and returns 128 + signal exit code
    # subprocess returns -<signal> for signals
    # these things don't seem very portable
    elif result.returncode in (137, 143, -9, -15):
        print("OUT OF MEMORY")
        metrics = {
            "status": "OOM",
            "condition": "Out of Memory",
            "objective": None,
            "runtime": "N/A",
            "reported_runtime": None,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    elif result.returncode != 0:
        print(
            f"ERROR running solver. Return code: {result.returncode}\n",
            f"Stdout:\n{result.stdout}\n",
            f"Stderr:\n{result.stderr}\n",
        )
        # Errors are also said to have run for `timeout`s, so that they appear
        # along with timeouts in charts
        metrics = {
            "status": "ER",
            "condition": "Error",
            "objective": None,
            "runtime": timeout,
            "reported_runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    else:
        print(
            f"Solver command:\n {'\n'.join(line for line in result.stdout.splitlines() if 'running command' in line)}\n"
        )
        metrics = json.loads(result.stdout.splitlines()[-1])

    if metrics["status"] not in {"ok", "TO", "ER", "OOM"}:
        print(f"WARNING: unknown solver status: {metrics['status']}")

    metrics["memory"] = memory
    metrics["timeout"] = timeout

    return metrics


def get_highs_binary_version():
    """Get the version of the HiGHS binary from the --version command"""
    highs_binary = "/opt/highs/bin/highs"

    try:
        result = subprocess.run(
            [highs_binary, "--version"],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8",
        )

        version_match = re.search(r"HiGHS version (\d+\.\d+\.\d+)", result.stdout)
        if version_match:
            return version_match.group(1)

        return "unknown"
    except Exception as e:
        print(f"Error getting HiGHS binary version: {str(e)}")
        return "unknown"


def benchmark_highs_binary():
    """
    Run a reference benchmark using the pre-installed HiGHS binary
    """
    reference_model = "/benchmark-test-model.lp"
    highs_binary = "/opt/highs/bin/highs"

    command = [
        highs_binary,
        reference_model,
    ]

    # Run the command and capture the output
    start_time = time.perf_counter()
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
    )
    runtime = time.perf_counter() - start_time
    if result.returncode != 0:
        print(f"ERROR running solver. Return code:\n{result.returncode}")
        metrics = {
            "status": "ER",
            "condition": "Error",
            "objective": None,
            "runtime": runtime,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    else:
        # Parse HiGHS output to extract objective value
        objective = None
        for line in result.stdout.splitlines():
            if "Objective value" in line:
                try:
                    objective = float(line.split(":")[-1].strip())
                except (ValueError, IndexError):
                    pass

        metrics = {
            "status": "OK",
            "condition": "Optimal",
            "objective": objective,
            "runtime": runtime,
            "memory": "N/A",
            "duality_gap": None,  # Not available from command line output
            "max_integrality_violation": None,  # Not available from command line output
        }

    return metrics


def main(
    benchmark_yaml_path,
    solvers,
    year=None,
    iterations=1,
    reference_interval=0,  # Default: disabled
    append=False,
    run_id=None,
):
    # If no run_id is provided, generate one
    if run_id is None:
        run_id = f"{time.strftime('%Y%m%d_%H%M%S')}_{hostname}"
        print(f"Generated run_id: {run_id}")
    else:
        print(f"Using provided run_id: {run_id}")

    size_categories = None  # TODO add this to CLI args
    results = {}

    # Track the last time we ran the reference benchmark
    last_reference_run = 0

    # Load benchmarks from YAML file
    with open(benchmark_yaml_path, "r") as file:
        yaml_content = yaml.safe_load(file)
        benchmarks_info = yaml_content["benchmarks"]
        # Read timeout from top-level YAML if present
        yaml_timeout_seconds = yaml_content.get("timeout_seconds")

    # Create results folder `results/` if it doesn't exist
    results_folder = Path(__file__).parent.parent / "results"
    os.makedirs(results_folder, exist_ok=True)

    results_csv = results_folder / "benchmark_results.csv"
    mean_stddev_csv = results_folder / "benchmark_results_mean_stddev.csv"

    # Write headers if overriding or file doesn't exist
    if not append or not results_csv.exists() or not mean_stddev_csv.exists():
        write_csv_headers(results_csv, mean_stddev_csv)
    # TODO put the benchmarks in a better place; for now storing in `runner/benchmarks/``
    benchmarks_folder = Path(__file__).parent / "benchmarks/"
    os.makedirs(benchmarks_folder, exist_ok=True)

    solvers_versions = get_conda_package_versions(solvers, f"benchmark-{year}")

    # Preprocess the sizes and make a list of individual benchmark files to run on
    processed_benchmarks = []
    for benchmark_name, benchmark_info in benchmarks_info.items():
        for instance in benchmark_info["Sizes"]:
            # Filter to the desired size_categories
            if size_categories is not None and instance["Size"] not in size_categories:
                continue

            # Determine the file path to use for the benchmark
            if "Path" in instance:
                benchmark_path = Path(instance["Path"])
                if not benchmark_path.exists():
                    raise FileNotFoundError(
                        f"File specified in 'Path' does not exist: {benchmark_path}"
                    )
            elif "URL" in instance:
                # TODO do something better like adding a yaml field for format
                if instance["URL"].endswith(".mps"):
                    format = "mps"
                elif instance["URL"].endswith(".mps.gz"):
                    format = "mps.gz"
                else:
                    format = "lp"
                benchmark_path = (
                    benchmarks_folder / f"{benchmark_name}-{instance['Name']}.{format}"
                )
                download_file_from_google_drive(instance["URL"], benchmark_path)

                # Gzip files are unzipped by the above function, so update path accordingly
                if benchmark_path.suffix == ".gz":
                    benchmark_path = benchmark_path.with_suffix("")
            else:
                raise ValueError("No valid 'Path' or 'URL' found for benchmark entry.")
            processed_benchmarks.append(
                {
                    "name": benchmark_name,
                    "size": instance["Name"],
                    "size_category": instance["Size"],
                    "path": benchmark_path,
                    "timeout_seconds": yaml_timeout_seconds,
                }
            )

    print(
        f"Found {len(processed_benchmarks)} benchmark instances"
        + ("" if size_categories is None else f" matching {size_categories}")
    )

    reference_solver_version = ""
    if reference_interval > 0:
        reference_solver_version = get_highs_binary_version()

    for benchmark in processed_benchmarks:
        # Set timeout from YAML if provided, otherwise use size-category defaults (1h for S/M, 10h for L)
        timeout = benchmark.get("timeout_seconds") or (
            10 * 60 * 60 if benchmark["size_category"] == "L" else 60 * 60
        )

        for solver in solvers:
            solver_version = solvers_versions.get(solver)
            if not solver_version:
                print(f"Solver {solver} is not available. Skipping.")
                continue

            print(f"Found solver {solver} with version {solver_version}")

            metrics = {}
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                print(
                    f"Running solver {solver} (version {solver_version}) on {benchmark['path']} ({i})...",
                    flush=True,
                )

                # Record timestamp before running the solver
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

                metrics = benchmark_solver(
                    benchmark["path"], solver, timeout, solver_version
                )

                metrics["size"] = benchmark["size"]
                metrics["solver"] = solver
                metrics["solver_version"] = solver_version
                metrics["solver_release_year"] = year

                runtimes.append(metrics["runtime"])
                memory_usages.append(metrics["memory"])

                # Write each benchmark result immediately after the measurement
                write_csv_row(
                    results_csv, benchmark["name"], metrics, run_id, timestamp
                )

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
            write_csv_summary_row(
                mean_stddev_csv, benchmark["name"], metrics, run_id, timestamp
            )

            results[(benchmark["name"], benchmark["size"], solver, solver_version)] = (
                metrics
            )

            # Check if we should run the reference benchmark based on the interval
            if reference_interval > 0:
                current_time = time.time()
                time_since_last_run = current_time - last_reference_run

                if last_reference_run == 0 or time_since_last_run >= int(
                    reference_interval
                ):
                    print(
                        f"Running reference benchmark with HiGHS binary (interval: {reference_interval}s)...",
                        flush=True,
                    )
                    reference_metrics = benchmark_highs_binary()

                    # Add required fields to reference metrics
                    reference_metrics["size"] = "reference"
                    reference_metrics["solver"] = "highs-binary"
                    reference_metrics["solver_version"] = reference_solver_version
                    reference_metrics["solver_release_year"] = "N/A"
                    reference_metrics["reported_runtime"] = None
                    reference_metrics["timeout"] = None

                    # Record reference benchmark results
                    reference_timestamp = datetime.datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S.%f"
                    )
                    write_csv_row(
                        results_csv,
                        "reference-benchmark",
                        reference_metrics,
                        run_id,
                        reference_timestamp,
                    )

                    # Update the last reference run time
                    last_reference_run = current_time
                else:
                    print(
                        f"Skipping reference benchmark (last run {time_since_last_run:.1f}s ago, interval: {reference_interval}s)",
                        flush=True,
                    )

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the benchmarks specified in the given file."
    )
    parser.add_argument(
        "benchmark_yaml_path", type=str, help="Path to the benchmarks YAML file."
    )
    parser.add_argument(
        "year",
        type=str,
        help="Denote the benchmarks as having been run on solvers from given year.",
    )
    parser.add_argument(
        "--solvers",
        type=str,
        nargs="+",
        default=["highs", "scip", "cbc", "gurobi", "glpk"],
        help="The list of solvers to run. Solvers not present in the active environment will be skipped.",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append to the results file instead of overwriting it.",
    )
    parser.add_argument(
        "--ref_bench_interval",
        type=int,
        default=0,
        help="Run a reference benchmark in between benchmark instances, at most once every given number of seconds.",
    )
    parser.add_argument(
        "--run_id",
        type=str,
        default=None,
        help="Unique identifier for this benchmark run.",
    )
    args = parser.parse_args()

    main(
        args.benchmark_yaml_path,
        args.solvers,
        args.year,
        reference_interval=args.ref_bench_interval,
        append=args.append,
        run_id=args.run_id,
    )
    # Print a message indicating completion
    print("Benchmarking complete.")

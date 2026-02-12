"""
Benchmark Executor Script

This script is the core executor for running a set of benchmarks against specified solvers
within a single, pre-configured Conda environment. It is designed to be called by an
orchestrator script (like `run_all_benchmarks.py`) which manages multiple environments
for different years.

Key Responsibilities:
- Parses a YAML file that defines the benchmarks, including problem file locations (URL or local path).
- Downloads and prepares benchmark problem files.
- For each problem, it iterates through a list of specified solvers.
- Executes each solver on the problem file using `systemd-run` to enforce strict time and memory limits.
- Captures detailed performance metrics: runtime, memory usage, solver status, termination condition, and objective value.
- Records metadata about the run, including solver versions, git commit hash, and machine details.
- Writes the detailed results to `results/benchmark_results.csv` and a summary to `results/benchmark_results_mean_stddev.csv`.
- Optionally runs a reference benchmark at a specified interval to monitor system performance stability during long runs.

This script should not be run directly by the user for a multi-year benchmark campaign.
Use the `run_all_benchmarks.py` wrapper for that purpose.

Example Usage (as called by a wrapper):
python runner/run_benchmarks.py benchmarks.yaml 2023 \\
    --solvers gurobi highs scip \\
    --run_id 20240520_123000_my-machine \\
    --append
"""

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
from collections import OrderedDict
from pathlib import Path
from socket import gethostname
from typing import Any, Iterable, Dict, List, Optional, Tuple

import psutil
import requests
import yaml
from runner.run_solver import HighsVariant


def get_conda_package_versions(
    solvers: list[str], env_name: str | None = None
) -> dict[str, str | None]:
    """
    Get the versions of specified solver packages from a Conda environment.

    This function executes `conda list` to find the versions of installed
    packages corresponding to a given list of solvers. It handles special
    cases like HiGHS-HiPO variants which are not installed via Conda.

    Parameters
    ----------
    solvers : list[str]
        A list of solver names to look up.
    env_name : str or None, optional
        The name of the Conda environment to inspect. If None, the currently
        active environment is used. Default is None.

    Returns
    -------
    dict[str, str or None]
        A dictionary mapping each solver name to its version string. If a
        solver's package is not found, the value will be None.

    Raises
    ------
    ValueError
        If the `conda list` command fails to execute.
    """

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
        name_to_pkg = {"highs": "highspy", "cbc": "coin-or-cbc"}
        solver_versions = {}
        for solver in solvers:
            # Handle highs-hipo variants as special cases - not conda packages
            if solver in [
                variant for variant in HighsVariant
            ]:  # For py3.10 compatibility
                solver_versions[solver] = get_highs_hipo_version()
            else:
                package = name_to_pkg.get(solver, solver)
                solver_versions[solver] = installed_packages.get(package, None)

        return solver_versions

    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing conda command: {e.stderr or str(e)}")


def download_benchmark_file(url, dest_path: Path) -> None:
    """
    \Download a file from url and save it locally in the specified folder if it doesn't already exist.

    If the URL is on GCS (starting gs://), then this uses `gsutil` to download the file (requires authentication).
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

    if url.startswith("gs://"):
        # GCS file, so download using gsutil
        print(f"Downloading {url} to {dest_path} using gsutil...", end="")
        cmd = ["gsutil", "cp", url, dest_path]
        _result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("done.")
    else:
        # Perform the download with streaming to handle large files
        print(f"Downloading {url} to {dest_path}...", end="")
        with requests.get(url, stream=True) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("done.")

    if dest_path.suffix == ".gz":
        print(f"Unzipping {dest_path}...")
        with gzip.open(dest_path, "rb") as gz_file:
            uncompressed_file_path = dest_path.with_suffix("")
            with open(uncompressed_file_path, "wb") as uncompressed_file:
                shutil.copyfileobj(gz_file, uncompressed_file)
        os.remove(dest_path)
        print(f"Unzipped to {uncompressed_file_path}.")


def parse_memory(output: str) -> float:
    """
    Parse memory usage from the output of `/usr/bin/time`.

    This function extracts the 'MaxResidentSetSizeKB' value from the last line
    of the provided command output, converts it to a float, and returns it
    in megabytes (MB).

    Parameters
    ----------
    output : str
        The standard error output from a command, expected to contain memory
        usage information from `/usr/bin/time`.

    Returns
    -------
    float
        The maximum resident set size in megabytes (MB).

    Raises
    ------
    ValueError
        If the 'MaxResidentSetSizeKB=' string is not found in the last line
        of the output.
    """
    line = output.splitlines()[-1]
    if "MaxResidentSetSizeKB=" in line:
        parts = line.strip().split("=")
        max_resident_set_size = parts[-1]
        return float(max_resident_set_size) / 1000  # Convert to MB
    raise ValueError(f"Could not find memory usage in subprocess output:\n{output}")


def csv_record(check: bool = False, **kwargs: Any) -> OrderedDict[str, Any]:
    """
    Create an ordered dictionary representing a single benchmark record.

    This function constructs a standardized record from keyword arguments.
    It can optionally check for missing (None) values.

    Parameters
    ----------
    check : bool, optional
        If True, the function will check for any values that are None and
        raise a ValueError if any are found. Default is False.
    **kwargs : Any
        Keyword arguments corresponding to the fields of the benchmark record.
        Expected keys include 'benchmark_name', 'size', 'solver', etc.

    Returns
    -------
    OrderedDict[str, Any]
        An ordered dictionary containing the benchmark data.

    Raises
    ------
    ValueError
        If `check` is True and any of the expected record fields are None.
    """
    record = OrderedDict(
        [
            ("Benchmark", kwargs.get("benchmark_name")),
            ("Size", kwargs.get("size")),
            ("Solver", kwargs.get("solver")),
            ("Solver Version", kwargs.get("solver_version")),
            ("Solver Release Year", kwargs.get("solver_release_year")),
            ("Status", kwargs.get("status")),
            ("Termination Condition", kwargs.get("condition")),
            ("Runtime (s)", kwargs.get("runtime")),
            ("Memory Usage (MB)", kwargs.get("memory")),
            ("Objective Value", kwargs.get("objective")),
            ("Max Integrality Violation", kwargs.get("max_integrality_violation")),
            ("Duality Gap", kwargs.get("duality_gap")),
            ("Reported Runtime (s)", kwargs.get("reported_runtime")),
            ("Timeout", kwargs.get("timeout")),
            ("Hostname", kwargs.get("hostname")),
            ("Run ID", kwargs.get("run_id")),
            ("Timestamp", kwargs.get("timestamp")),
            ("VM Instance Type", kwargs.get("vm_instance_type")),
            ("VM Zone", kwargs.get("vm_zone")),
            ("Solver benchmark version", kwargs.get("solver_benchmark_version")),
        ]
    )

    if check:
        missing_attrs = [key for key, val in record.items() if val is None]
        if missing_attrs:
            raise ValueError(f"Missing attributes: {missing_attrs}")

    return record


def write_csv_headers(
    results_csv: Path,
    mean_stddev_csv: Path,
    headers: Iterable[str] = csv_record(check=False).keys(),
) -> None:
    """
    Write headers to the main results and summary CSV files.

    This function initializes two CSV files with their respective headers. If the
    files already exist, they will be overwritten.

    Parameters
    ----------
    results_csv : Path
        Path to the main benchmark results CSV file.
    mean_stddev_csv : Path
        Path to the summary CSV file for mean and standard deviation.
    headers : Iterable[str], optional
        An iterable of header strings for the main results file. Defaults to
        the keys generated by `csv_record()`.
    """
    # Initialize CSV files with headers
    with open(results_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(headers)

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


def write_csv_row(
    results_csv: Path,
    benchmark_name: str,
    metrics: Dict[str, Any],
    run_id: str,
    timestamp: str,
    vm_instance_type: str,
    vm_zone: str,
    hostname: str,
    solver_benchmark_version: str,
) -> None:
    """
    Append a single result row to the main results CSV file.

    Parameters
    ----------
    results_csv : Path
        Path to the main benchmark results CSV file.
    benchmark_name : str
        The name of the benchmark problem.
    metrics : Dict[str, Any]
        A dictionary containing the collected metrics for this run.
    run_id : str
        The unique identifier for the entire benchmark session.
    timestamp : str
        The timestamp for this specific solver run.
    vm_instance_type : str
        The type of the VM instance where the benchmark was run.
    vm_zone : str
        The zone of the VM instance.
    hostname : str
        The hostname of the machine.
    solver_benchmark_version : str
        The git commit hash or version of the solver-benchmark repository.
    """
    # NOTE: ensure the order is the same as the headers above
    with open(results_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            csv_record(
                check=False,  # allow None values
                **metrics,
                run_id=run_id,
                timestamp=timestamp,
                benchmark_name=benchmark_name,
                vm_instance_type=vm_instance_type,
                vm_zone=vm_zone,
                solver_benchmark_version=solver_benchmark_version,
                hostname=hostname,
            ).values()
        )


def write_csv_summary_row(
    mean_stddev_csv: Path,
    benchmark_name: str,
    metrics: Dict[str, Any],
    run_id: str,
    timestamp: str,
) -> None:
    """
    Append a single summary row to the mean/stddev CSV file.

    Parameters
    ----------
    mean_stddev_csv : Path
        Path to the summary CSV file for mean and standard deviation.
    benchmark_name : str
        The name of the benchmark problem.
    metrics : Dict[str, Any]
        A dictionary containing the collected and calculated metrics for this
        benchmark, including mean and standard deviation of runtime and memory.
    run_id : str
        The unique identifier for the entire benchmark session.
    timestamp : str
        The timestamp for the last run of this benchmark.
    """
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


def benchmark_solver(
    input_file: Path, solver_name: str, timeout: int, solver_version: str
) -> Dict[str, Any]:
    """
    Execute a single solver on a benchmark file with resource limits.

    This function uses `systemd-run` to create a transient scope for the solver
    process, enforcing strict memory limits (95% of available system memory)
    and disabling swap. It also uses `/usr/bin/time` to measure the peak
    resident set size and `timeout` to enforce a time limit.

    It captures the solver's output, parses performance metrics, and handles
    various termination scenarios like timeout, out-of-memory, and errors.

    Parameters
    ----------
    input_file : Path
        The path to the benchmark problem file.
    solver_name : str
        The name of the solver to execute.
    timeout : int
        The maximum allowed runtime in seconds.
    solver_version : str
        The version of the solver to use.

    Returns
    -------
    Dict[str, Any]
        A dictionary containing the collected performance metrics, including
        runtime, memory usage, status, and objective value.
    """
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

    # Append the stderr to the log file
    log_file = (
        Path(__file__).parent
        / "logs"
        / f"{Path(input_file).stem}-{solver_name}-{solver_version}.log"
    )
    if log_file.exists:
        with open(log_file, "a") as f:
            f.write("\nSTDERR:\n")
            f.write(result.stderr)
    else:
        print(f"ERROR: couldn't find log file {log_file}")

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


def get_highs_hipo_version():
    """Get the version of the HiGHS-HiPO binary from the --version command"""
    if os.geteuid() != 0:
        highs_hipo_binary = "/home/madhukar/oet/solver-benchmark/highs-installs/highs-hipo-workspace/HiGHS/build/bin/highs"
    else:
        highs_hipo_binary = "/opt/highs-hipo-workspace/HiGHS/build/bin/highs"

    try:
        result = subprocess.run(
            [highs_hipo_binary, "--version"],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8",
        )

        version_match = re.search(r"HiGHS version (\d+\.\d+\.\d+)", result.stdout)
        if version_match:
            return version_match.group(1) + "-hipo"

        return "unknown-hipo"
    except Exception as e:
        print(f"Error getting HiGHS-HiPO binary version: {str(e)}")
        return "unknown-hipo"


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
    benchmark_yaml_path: str,
    solvers: List[str],
    year: Optional[str] = None,
    iterations: int = 1,
    reference_interval: int = 0,
    append: bool = False,
    run_id: Optional[str] = None,
) -> Dict[Tuple[str, str, str, str], Dict[str, Any]]:
    """
    Run a suite of benchmarks based on a YAML configuration file.

    This is the main entry point for the benchmark runner script. It orchestrates
    the entire process of downloading benchmarks, running solvers, collecting
    metrics, and writing results to CSV files.

    Parameters
    ----------
    benchmark_yaml_path : str
        Path to the YAML file defining the benchmarks.
    solvers : List[str]
        A list of solver names to execute.
    year : Optional[str], optional
        The release year of the solvers to use, corresponding to a Conda
        environment name (e.g., '2023' for 'benchmark-2023'). Defaults to None.
    iterations : int, optional
        The number of times to run each solver on each problem. Defaults to 1.
    reference_interval : int, optional
        The interval in seconds at which to run a reference benchmark to monitor
        system stability. If 0, the reference benchmark is disabled. Defaults to 0.
    append : bool, optional
        If True, results will be appended to existing CSV files. If False,
        the files will be overwritten. Defaults to False.
    run_id : Optional[str], optional
        A unique identifier for this entire benchmark session. If None, a new
        ID will be generated based on the current timestamp and hostname.
        Defaults to None.

    Returns
    -------
    Dict[Tuple[str, str, str, str], Dict[str, Any]]
        A dictionary containing the final metrics for each benchmark run. The
        keys are tuples of (benchmark_name, size, solver_name, solver_version),
        and the values are dictionaries of the collected metrics.
    """
    # If no run_id is provided, generate one
    hostname = gethostname()

    environment_metadata = {"hostname": hostname}
    try:
        environment_metadata["vm_instance_type"] = requests.get(
            "http://metadata.google.internal/computeMetadata/v1/instance/machine-type",
            headers={"Metadata-Flavor": "Google"},
        ).text.split(
            "/"
        )[
            -1
        ]  # the api will return a response like projects/319823961160/machineTypes/c4-highmem-8
    except Exception as e:
        print(f"Error getting VM instance type: {e}")
        environment_metadata["vm_instance_type"] = "unknown"

    try:
        environment_metadata["solver_benchmark_version"] = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()
    except Exception as e:
        print(f"Error getting git commit hash: {e}")
        environment_metadata["solver_benchmark_version"] = "unknown"

    try:
        # curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/zone
        environment_metadata["vm_zone"] = requests.get(
            "http://metadata.google.internal/computeMetadata/v1/instance/zone",
            headers={"Metadata-Flavor": "Google"},
        ).text.split("/")[-1]
    except Exception as e:
        print(f"Error getting VM zone: {e}")
        environment_metadata["vm_zone"] = "unknown"

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
                # TODO share this code with validate_urls.py
                gz = instance["URL"].endswith(".gz")
                base = instance["URL"][:-3] if gz else instance["URL"]
                ext = base[base.rfind(".") :]
                # If no dot was found, ext will be the full string; make it empty instead
                if "." not in ext:
                    ext = ""
                ext += ".gz" if gz else ""
                benchmark_path = (
                    benchmarks_folder / f"{benchmark_name}-{instance['Name']}{ext}"
                )
                download_benchmark_file(instance["URL"], benchmark_path)

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
                    "class": benchmark_info.get("Problem class"),
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
        # Set timeout from YAML if provided, otherwise use size-category defaults (1h for S/M, 24h for L)
        timeout = benchmark.get("timeout_seconds") or (
            24 * 60 * 60 if benchmark["size_category"] == "L" else 60 * 60
        )

        for solver in solvers:
            # TODO a hack to run only the latest version per solver on Ls
            if (
                benchmark["size_category"] == "L"
                and year != "2025"
                and not (
                    year == "2024" and solver == "cbc"
                )  # Latest CBC release is in 2024
            ):
                print(
                    f"WARNING: skipping {solver} in {year} because this benchmark instance is size L"
                )
                continue

            # Restrict highs-hipo variants to 2025 and LPs only
            if solver in [
                variant.value for variant in HighsVariant
            ] and (  # For py3.10 compatibility
                year != "2025" or benchmark["class"] != "LP"
            ):
                print(
                    f"Solver {solver} is only available for LP benchmarks and year 2025."
                    f" Current year: {year}, problem class: {benchmark['class']}. Skipping."
                )
                continue

            solver_version = solvers_versions.get(solver)
            if not solver_version:
                print(f"Solver {solver} is not available. Skipping.")
                continue

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
                    results_csv,
                    benchmark["name"],
                    metrics,
                    run_id,
                    timestamp,
                    **environment_metadata,
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
                        **environment_metadata,
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
        help="The list of solvers to run. Solvers not present in the active environment will be skipped. For 2025, highs variants are available: highs-hipo, highs-ipm, highs-hipo-32, highs-hipo-64, highs-hipo-128.",
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

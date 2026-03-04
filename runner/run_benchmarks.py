"""
Benchmark Runner Script
=======================

This script automates the benchmarking of multiple optimization solvers
(e.g., HiGHS, GLPK, Gurobi, SCIP, CBC) on a set of
benchmark problem instances defined in a YAML configuration file. It manages
downloading benchmark files, running solvers in isolated environments with
resource limits, collecting metrics (runtime, memory, status, objective, etc.),
and writing results to CSV files for further analysis.

Features
--------
- Supports running multiple solvers and benchmark instances in series.
- Handles solver-specific environment setup and version detection.
- Enforces memory and runtime limits for solver runs.
- Collects and records detailed metrics, including runtime, memory usage,
  status, objective value, duality gap, and integrality violation.
- Outputs results and summary statistics to CSV files.

Example Usage
-------------
Run the script from the command line:

    python runner/run_benchmarks.py <benchmark_yaml> <year> [OPTIONS]

Parameters
------------
--benchmark_yaml_path : str
    Path to the benchmark configuration YAML file (e.g., ../results/metadata.yaml).
--year : str
    Solver release year (e.g., 2020-2025).
--solvers : list of str, optional
    Space-separated list of solvers to run. Defaults to all supported solvers.
--append : bool, optional
    Append to the results CSV file instead of overwriting. Default is False.
--ref_bench_interval : int, optional
    Interval in seconds to run a reference benchmark with the HiGHS binary.
--run_id : str, optional
    Unique identifier for this benchmark run.

Returns
--------
- Results for each solver/benchmark instance are written to `results/benchmark_results.csv`.
- Summary statistics (mean, stddev) are written to `results/benchmark_results_mean_stddev.csv`.
- Logs and solution files are saved in the `runner/logs/` and `runner/solutions/` directories.
"""

import argparse
import csv
import datetime
import gzip
import json
import logging
import os
import re
import shutil
import statistics
import subprocess
import time
import typing
from collections import OrderedDict
from pathlib import Path
from socket import gethostname

import psutil
import requests
import yaml

logger = logging.getLogger(__name__)


def get_conda_package_versions(solvers: list[str], env_name=None) -> dict[str, str]:
    """
    Get the installed version of specified solver packages in a conda environment.

    Parameters
    ----------
    solvers : list of str
        List of solver names to query for package versions.
    env_name : str, optional
        Name of the conda environment to query. If None, uses the current active environment.

    Returns
    -------
    solver_versions : dict
        Dictionary mapping each solver name to its installed version string in the specified conda environment.

    Raises
    ------
    ValueError
        If the conda command fails to execute.
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
        name_to_pkg = {
            "highs": "highspy",
            "highs-hipo": "highspy",
            "highs-ipm": "highspy",
            "cbc": "coin-or-cbc",
            "scip": "pyscipopt",
        }
        solver_versions = {}
        for solver in solvers:
            package = name_to_pkg.get(solver, solver)
            solver_versions[solver] = installed_packages.get(package, None)

        return solver_versions

    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing conda command: {e.stderr or str(e)}")


def _download_via_requests(url: str, dest: Path, chunk_size: int = 8192) -> None:
    """
    Download a file over HTTP(S) using HTTP/HTTPS requests..

    Parameters
    ----------
    url : str
        HTTP or HTTPS URL to download.
    dest : pathlib.Path
        Local destination path where the downloaded file will be written.
    chunk_size : int, optional
        Size in bytes of chunks to read from the response stream (default: 8192).
    """
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
    os.replace(tmp, dest)
    logger.info(f"Downloaded {url} to {dest} via requests")


def _download_via_gsutil(url: str, dest: Path) -> None:
    """
    Download a file from Google Cloud Storage using the gsutil command.

    Parameters
    ----------
    url : str
        GCS URL to download. Must start with ``gs://``.
    dest : pathlib.Path
        Local destination path where the downloaded file will be written.

    Raises
    ------
    subprocess.CalledProcessError
        If the `gsutil` command exits with a non-zero status.
    """
    subprocess.run(
        ["gsutil", "cp", url, str(dest)], check=True, capture_output=True, text=True
    )
    logger.info(f"Downloaded {url} to {dest} via gsutil")


def _unzip_gz(path: Path) -> Path:
    if path.suffix != ".gz":
        return path
    uncompressed = path.with_suffix("")
    with gzip.open(path, "rb") as gz_f, open(uncompressed, "wb") as out_f:
        shutil.copyfileobj(gz_f, out_f)
    os.remove(path)
    logger.info(f"Unzipped {path} -> {uncompressed}")
    return uncompressed


def download_benchmark_file(url: str, dest_path: Path) -> None:
    """
    Download a file from a URL and save it locally, unzipping if necessary.

    Parameters
    ----------
    url : str
        The URL of the file to download. If the URL starts with 'gs://', `gsutil` is used for downloading.
    dest_path : pathlib.Path
        The local path where the downloaded file will be saved. If the file is gzipped (.gz), it will be unzipped after download.

    Notes
    -----
    - If the file already exists at the destination (uncompressed), the download is skipped.
    - For Google Cloud Storage URLs, requires `gsutil` and authentication.
    - Automatically unzips `.gz` files after download and removes the compressed file.
    - Creates the destination directory if it does not exist.
    """
    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    # determine the final uncompressed path to check for existing file
    final_uncompressed = (
        dest_path.with_suffix("") if dest_path.suffix == ".gz" else dest_path
    )
    if final_uncompressed.exists():
        logger.info(f"File already exists at {final_uncompressed}. Skipping download.")
        return

    # download to dest_path (compressed or not)
    if url.startswith("gs://"):
        _download_via_gsutil(url, dest_path)
    else:
        _download_via_requests(url, dest_path)

    # if compressed, unzip and remove the .gz
    if dest_path.suffix == ".gz":
        _unzip_gz(dest_path)


def parse_memory(output: str) -> float:
    """
    Parse the maximum resident set size (memory usage) from subprocess output.

    Parameters
    ----------
    output : str
        The output string from a subprocess, expected to contain a line with 'MaxResidentSetSizeKB='.

    Returns
    -------
    memory_mb : float
        The maximum resident set size in megabytes (MB).

    Raises
    ------
    ValueError
        If the memory usage line is not found in the output.

    Notes
    -----
    - Assumes the memory usage is reported in kilobytes (KB) and converts it to megabytes (MB).
    """
    line = output.splitlines()[-1]
    if "MaxResidentSetSizeKB=" in line:
        parts = line.strip().split("=")
        max_resident_set_size = parts[-1]
        return float(max_resident_set_size) / 1000  # Convert to MB
    raise ValueError(f"Could not find memory usage in subprocess output:\n{output}")


def csv_record(check=False, **kwargs):
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
    results_csv, mean_stddev_csv, headers=csv_record(check=False).keys()
):
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
    results_csv,
    benchmark_name,
    metrics,
    run_id,
    timestamp,
    vm_instance_type,
    vm_zone,
    hostname,
    solver_benchmark_version,
):
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


def get_solver_name_and_version(solver_name: str) -> tuple[str, str | None]:
    """
    Split solver names into base solver and variant components.

    Parses solver names like 'highs-hipo', 'highs ipm', or 'highs' into
    their base solver and variant parts. For non-highs solvers, returns
    the original name with no variant.

    Parameters
    ----------
    solver_name : str
        The solver name to split. Can be a highs variant like 'highs-hipo',
        'highs ipm', 'highs', or any other solver name.

    Returns
    -------
    tuple[str, str | None]
        A tuple containing:
        - base_solver : str
            The base solver name ('highs' for highs variants, otherwise
            the original solver_name).
        - variant : str or None
            The variant suffix if present (e.g., 'hipo', 'ipm'), or None
            if no variant is found.

    Examples
    --------
    >>> get_solver_name_and_version("highs-hipo")
    ('highs', 'hipo')

    >>> get_solver_name_and_version("highs")
    ('highs', None)

    >>> _get_solver_name_and_version("glpk")
    ('glpk', None)
    """
    m = re.match(r"^(highs)(?:[-\s](?P<variant>[\w-]+))?$", solver_name.lower())
    if m:
        return m.group(1), m.group("variant")
    return solver_name, None


def build_solver_command(
    input_file: Path,
    solver_name: str,
    timeout: int,
    solver_version: str,
    memory_limit_bytes: int,
    reference_benchmark: bool,
) -> list[str]:
    """
    Build the shell command to run a solver with resource limits.

    Parameters
    ----------
    input_file : Path
        Path to the benchmark problem file to be solved.
    solver_name : str
        Name of the solver to run (e.g., "highs", "gurobi", "scip", "cbc", "glpk").
    timeout : int
        Maximum allowed runtime for the solver in seconds.
    solver_version : str
        Version string of the solver, passed to the solver script.
    memory_limit_bytes : int
        Maximum memory the solver process is allowed to use, in bytes.
    reference_benchmark : bool
        If True, appends the ``--highs_solver_variant hipo`` flag to run
        the HiGHS HiPO variant on a reference instance.

    Returns
    -------
    command : list of str
        The command as a list of strings, suitable for passing to
        ``subprocess.run``.
    """
    base_solver, variant = get_solver_name_and_version(solver_name)

    command = ["systemd-run"]
    if os.geteuid() != 0:
        command.append("--user")

    command.extend(
        [
            "--scope",
            "--property=MemoryMax={}".format(memory_limit_bytes),
            "--property=MemorySwapMax=0",
            "/usr/bin/time",
            "--format",
            "MaxResidentSetSizeKB=%M",
            "timeout",
            "{}s".format(timeout),
            "python",
            str(Path(__file__).parent / "run_solver.py"),
            "--solver_name {}".format(solver_name),
            "--input_file {}".format(input_file.as_posix()),
            "--solver_version {}".format(solver_version),
        ]
    )

    if variant:
        command.append(f"--highs_solver_variant {variant}")
    elif reference_benchmark and base_solver.lower() == "highs":
        command.append("--highs_solver_variant hipo")

    return command


def return_failure_metrics(
    status: str, condition: str, runtime: int | float | str
) -> dict[str, typing.Any]:
    """
    Build a metrics dictionary for solver failure cases.

    Parameters
    ----------
    status : str
        Short status code for the run (e.g., ``"TO"``, ``"OOM"``, ``"ER"``).
    condition : str
        Human-readable termination condition (e.g., ``"Timeout"``, ``"Out of Memory"``, ``"Error"``).
    runtime : int, float, or str
        Runtime to record in seconds, or a sentinel (e.g., ``"N/A"``) when not applicable.

    Returns
    -------
    metrics : dict
        Dictionary with the following keys:
        - ``status`` : str
            The provided short status code.
        - ``condition`` : str
            The provided termination condition.
        - ``objective`` : None
            Always ``None`` for failure cases.
        - ``runtime`` : int, float, or str
            The provided runtime value.
        - ``reported_runtime`` : float or None
            The numeric runtime if ``runtime`` is an ``int`` or ``float``, otherwise ``None``.
        - ``duality_gap`` : None
            Always ``None`` for failure cases.
        - ``max_integrality_violation`` : None
            Always ``None`` for failure cases.
    """
    reported_runtime = runtime if isinstance(runtime, (int, float)) else None
    return {
        "status": status,
        "condition": condition,
        "objective": None,
        "runtime": runtime,
        "reported_runtime": reported_runtime,
        "duality_gap": None,
        "max_integrality_violation": None,
    }


def parse_solver_result(result: subprocess.CompletedProcess, timeout: int) -> dict:
    """
    Interpret a subprocess `CompletedProcess` from a solver run and produce a metrics dictionary.

    Parameters
    ----------
    result : subprocess.CompletedProcess
        The result returned by ``subprocess.run`` when executing the solver wrapper.
    timeout : int
        Timeout value (in seconds) that was enforced for the solver run. Used for timeout/error metrics.

    Returns
    -------
    metrics : dict
        A metrics dictionary describing the solver outcome. For successful runs this is the JSON-parsed
        metrics object produced by the solver wrapper (parsed from the last line of ``result.stdout``).
        For failure cases a dictionary produced by ``return_failure_metrics`` is returned with keys:
        ``status``, ``condition``, ``objective`` (None), ``runtime``, ``reported_runtime``,
        ``duality_gap`` (None), and ``max_integrality_violation`` (None).

    Raises
    ------
    ValueError
        Not raised by this function directly, but callers should be aware that JSON parsing may raise
        exceptions if ``result.stdout`` does not contain valid JSON on the final line.
    """
    if result.returncode == 124:
        logger.info("TIMEOUT")
        return return_failure_metrics("TO", "Timeout", timeout)

    # systemd-run uses sigkill (9) or sigterm (15) to terminate
    # the process and returns 128 + signal exit code
    # subprocess returns -<signal> for signals
    # these things don't seem very portable
    if result.returncode in (137, 143, -9, -15):
        logger.info("OUT OF MEMORY")
        return return_failure_metrics("OOM", "Out of Memory", "N/A")

    if result.returncode != 0:
        logger.info(
            f"ERROR running solver. Return code: {result.returncode}\n"
            f"Stdout:\n{result.stdout}\n"
            f"Stderr:\n{result.stderr}\n"
        )
        return return_failure_metrics("ER", "Error", timeout)

    return json.loads(result.stdout.splitlines()[-1])


def benchmark_solver(
    input_file: Path,
    solver_name: str,
    timeout: int,
    solver_version: str,
    reference_benchmark=False,
) -> dict[str, object]:
    """
    Run a solver on a benchmark problem file with resource limits and collect metrics.

    Parameters
    ----------
    input_file : Path
        Path to the benchmark problem file.
    solver_name : str
        Name of the solver to run (e.g.,  "gurobi", "highs-hipo", "highs-ipm", "highs", "scip", "cbc" or "glpk").
    timeout : int
        Maximum allowed runtime for the solver in seconds.
    solver_version : str
        Version of the solver to use.
    reference_benchmark : bool, optional
        Whether this is a reference benchmark run (default: False). If True, run the reference benchmark.

    Returns
    -------
    metrics : dict
        Dictionary containing benchmark metrics:
        - status : str
            Solver status ("ok", "TO", "ER", "OOM").
        - condition : str
            Termination condition ("Optimal", "Timeout", "Error", "Out of Memory").
        - objective : float or None
            Objective value if available.
        - runtime : float or str
            Actual runtime in seconds or "N/A".
        - reported_runtime : float or None
            Runtime reported by the solver, if available.
        - duality_gap : float or None
            Duality gap for MILP problems, if available.
        - max_integrality_violation : float or None
            Maximum integrality violation for MILP problems, if available.
        - memory : float or None
            Maximum resident set size in MB.
        - timeout : int
            Timeout value in seconds.
    """
    available_memory_bytes = psutil.virtual_memory().available
    memory_limit_bytes = int(available_memory_bytes * 0.95)
    memory_limit_mb = memory_limit_bytes / (1024 * 1024)
    logger.info(
        f"Setting memory limit to {memory_limit_mb:.2f} MB (95% of available memory)."
    )

    command = build_solver_command(
        input_file,
        solver_name,
        timeout,
        solver_version,
        memory_limit_bytes,
        reference_benchmark,
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
    if log_file.exists():
        with open(log_file, "a") as f:
            f.write("\nSTDERR:\n")
            f.write(result.stderr)
    else:
        logger.info(f"ERROR: couldn't find log file {log_file}")

    memory = None
    try:
        memory = parse_memory(result.stderr)
    except ValueError:
        logger.error("Failed to parse memory usage from stderr")

    metrics = parse_solver_result(result, timeout)

    if metrics["status"] not in {"ok", "TO", "ER", "OOM"}:
        logger.info(f"WARNING: unknown solver status: {metrics['status']}")

    metrics["memory"] = memory
    metrics["timeout"] = timeout

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
        logger.error(f"Error getting VM instance type: {e}")
        environment_metadata["vm_instance_type"] = "unknown"

    try:
        environment_metadata["solver_benchmark_version"] = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()
    except Exception as e:
        logger.error(f"Error getting git commit hash: {e}")
        environment_metadata["solver_benchmark_version"] = "unknown"

    try:
        # curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/zone
        environment_metadata["vm_zone"] = requests.get(
            "http://metadata.google.internal/computeMetadata/v1/instance/zone",
            headers={"Metadata-Flavor": "Google"},
        ).text.split("/")[-1]
    except Exception as e:
        logger.error(f"Error getting VM zone: {e}")
        environment_metadata["vm_zone"] = "unknown"

    if run_id is None:
        run_id = f"{time.strftime('%Y%m%d_%H%M%S')}_{hostname}"
        logger.info(f"Generated run_id: {run_id}")
    else:
        logger.info(f"Using provided run_id: {run_id}")

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

    # Get solver versions from the conda environment to include in the results
    solvers_versions = get_conda_package_versions(solvers, f"benchmark-{year}")

    # Get the path of the reference benchmark
    reference_benchmark_path = Path(benchmarks_folder, "benchmark-test-model.lp")

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

    logger.info(
        f"Found {len(processed_benchmarks)} benchmark instances"
        + ("" if size_categories is None else f" matching {size_categories}")
    )

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
                logger.info(
                    f"WARNING: skipping {solver} in {year} because this benchmark instance is size L."
                )
                continue

            # Restrict highs-hipo variants to 2025 and LPs only
            if solver == "highs-hipo" and (  # For py3.10 compatibility
                year != "2025" or benchmark["class"] != "LP"
            ):
                logger.info(
                    f"Solver {solver} is only available for LP benchmarks and year 2025."
                    f" Current year: {year}, problem class: {benchmark['class']}. Skipping."
                )
                continue

            solver_version = solvers_versions.get(solver)
            if not solver_version:
                logger.info(f"Solver {solver} is not available. Skipping.")
                continue

            metrics = {}
            runtimes = []
            memory_usages = []

            for i in range(iterations):
                logger.info(
                    f"Running solver {solver} (version {solver_version}) on {benchmark['path']} ({i})..."
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
                    logger.info(
                        f"Running reference benchmark with HiGHS HiPO (interval: {reference_interval}s)..."
                    )
                    reference_metrics = benchmark_solver(
                        reference_benchmark_path,
                        solver_name="highs-hipo",
                        timeout=24 * 60 * 60,
                        solver_version=solvers_versions.get("highs-hipo"),
                        reference_benchmark=True,
                    )

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
                    logger.info(
                        f"Skipping reference benchmark (last run {time_since_last_run:.1f}s ago, interval: {reference_interval}s)"
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
    logger.info("Benchmarking complete.")

"""The per-problem run loop: ties `metadata`, `config`, `env`, `execution`,
and `results` together into an actual benchmark run.

Imported by `runner/benchmark.py`'s Typer CLI. Kept importable (not inlined
in the CLI) so it's testable without going through Typer's CLI-parsing layer.
"""

import datetime
import os
import statistics
import subprocess
import time
from pathlib import Path
from socket import gethostname
from typing import Any

import requests

from . import config, env
from .execution import get_highs_binary_version, run_reference_highs_binary, run_solver
from .metadata import load_problems
from .results import ensure_csv_schema, write_csv_row, write_csv_summary_row

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_PROBLEMS_FOLDER = Path(__file__).resolve().parent.parent / "benchmarks"


def _gather_environment_metadata() -> dict[str, str]:
    """Collect this machine's identity for the results CSV's environment columns.

    Returns
    -------
    dict[str, str]
        `hostname`, `vm_instance_type`, `vm_zone` (each `"unknown"` if this
        isn't a GCE VM or the metadata server is unreachable), and
        `solver_benchmark_version` (this repo's short git commit hash, or
        `"unknown"` if it can't be determined).
    """
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

    return environment_metadata


def run_benchmark(
    problems_yaml_path: str | Path,
    solver_configurations: list[str],
    year: str | None = None,
    num_seeds: int = 1,
    reference_interval: int = 0,  # Default: disabled
    append: bool = False,
    run_id: str | None = None,
) -> dict[tuple[str, str, str], dict[str, Any]]:
    """Run a list of solver configurations against a set of problems.

    Parameters
    ----------
    problems_yaml_path : str | Path
        Path to the benchmark run config YAML (see `metadata.load_problems`).
    solver_configurations : list[str]
        Solver configuration names to run against every problem (e.g.
        `["highs-default", "highs-hipo", "gurobi-default"]`), skipping any not eligible for
        `year` and a given problem (see `config.is_solver_eligible`) or not
        registered for `year` at all (see `env.get_registered_solver_versions`).
    year : str, optional
        The solver-version year to run, e.g. `"2025"`.
    num_seeds : int, optional
        Number of seeds to try per (problem, solver configuration) pair.
        When greater than 1, each repetition overrides the configuration's
        own fixed seed with 1, 2, 3, ... (see `execution.run_solver`'s
        `seed` parameter) -- starting at 1, not 0, since CBC's own seed
        option treats 0 as "use the time of day" rather than an actual
        fixed seed -- so repeated runs sample the solver's actual
        sensitivity to its seed rather than just re-measuring one
        deterministic solve. A timeout or error on one repetition skips the
        rest. Statistics are still recorded when this is 1 (mean == the
        single value, stddev == 0), and the seed is left unset (the
        configuration's own fixed seed applies).
    reference_interval : int, optional
        Minimum seconds between reference-benchmark runs (see
        `execution.run_reference_highs_binary`), interleaved between real
        problems to gauge cross-VM hardware speed variability. 0 disables it.
    append : bool, optional
        If True and the result CSVs already exist, append to them instead
        of overwriting.
    run_id : str, optional
        Identifier shared by every row from this run. Auto-generated from
        the current time and hostname if not given.

    Returns
    -------
    dict[tuple[str, str, str], dict[str, Any]]
        Every solver run's metrics, keyed by `(problem_id, solver_configuration,
        solver_version)`.
    """
    environment_metadata = _gather_environment_metadata()
    hostname = environment_metadata["hostname"]

    if run_id is None:
        run_id = f"{time.strftime('%Y%m%d_%H%M%S')}_{hostname}"
        print(f"Generated run_id: {run_id}")
    else:
        print(f"Using provided run_id: {run_id}")

    size_categories = None  # TODO add this to CLI args

    # Track the last time we ran the reference benchmark
    last_reference_run = 0.0

    results_folder = _REPO_ROOT / "results"
    os.makedirs(results_folder, exist_ok=True)

    results_csv = results_folder / "benchmark_results.csv"
    mean_stddev_csv = results_folder / "benchmark_results_mean_stddev.csv"

    # Write headers if overriding or a file doesn't exist yet; otherwise
    # widen an existing file to the current schema in place if it predates a
    # column added since (see `ensure_csv_schema`'s own docstring).
    ensure_csv_schema(results_csv, mean_stddev_csv, append)
    os.makedirs(_PROBLEMS_FOLDER, exist_ok=True)

    registered_solver_versions = env.get_registered_solver_versions(
        solver_configurations, year
    )

    problems = load_problems(problems_yaml_path, _PROBLEMS_FOLDER, size_categories)

    print(
        f"Found {len(problems)} problems"
        + ("" if size_categories is None else f" matching {size_categories}")
    )

    reference_solver_version = ""
    if reference_interval > 0:
        reference_solver_version = get_highs_binary_version()

    run_results: dict[tuple[str, str, str], dict[str, Any]] = {}

    for problem in problems:
        # Set timeout from YAML if provided, otherwise use size-category defaults (1h for S/M, 24h for L)
        timeout = problem.get("timeout_seconds") or (
            24 * 60 * 60 if problem["size_category"] == "L" else 60 * 60
        )

        for solver_configuration in solver_configurations:
            if not config.is_solver_eligible(
                solver_configuration,
                year,
                size_category=problem["size_category"],
                problem_class=problem["problem_class"],
            ):
                print(
                    f"Solver {solver_configuration} is not eligible for year {year}, "
                    f"size {problem['size_category']}, class {problem['problem_class']}. Skipping."
                )
                continue

            version_info = registered_solver_versions.get(solver_configuration)
            if not version_info:
                print(f"Solver {solver_configuration} is not available. Skipping.")
                continue
            solver_version = version_info["version"]
            env_name = version_info["env"]

            metrics: dict[str, Any] = {}
            runtimes = []
            memory_usages = []
            timestamp = ""

            # Seeds start at 1, not 0: CBC's own seed option (randomCbcSeed)
            # treats 0 as a sentinel meaning "use the time of day" instead of
            # an actual fixed seed (see solver_configurations.yaml's own
            # comment on cbc-default), which would make that repetition
            # silently non-deterministic. No other solver here gives 0 any
            # special meaning, so starting at 1 is safe for all of them.
            for seed_index in range(1, num_seeds + 1):
                # Vary the seed across repetitions so they sample the
                # solver's actual sensitivity to it.
                seed = seed_index if num_seeds > 1 else None

                print(
                    f"Running solver {solver_configuration} (version {solver_version}) "
                    f"on {problem['path']} ({seed_index})"
                    + (f" with seed {seed}" if seed is not None else "")
                    + "...",
                    flush=True,
                )

                # Record timestamp before running the solver
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

                metrics = run_solver(
                    problem["path"],
                    solver_configuration,
                    timeout,
                    solver_version,
                    env_name=env_name,
                    seed=seed,
                )

                # NOTE: results.csv_record expects the kwarg "solver" (its CSV
                # column is "Solver"), so the dict key stays "solver" even
                # though the value is a solver *configuration* name.
                metrics["solver"] = solver_configuration
                metrics["solver_version"] = solver_version
                metrics["solver_release_year"] = year
                metrics["seed"] = seed

                runtimes.append(metrics["runtime"])
                memory_usages.append(metrics["memory"])

                # Write each result immediately after the measurement
                write_csv_row(
                    results_csv,
                    problem["problem_id"],
                    metrics,
                    run_id,
                    timestamp,
                    **environment_metadata,
                )

                # If solver errors or times out, don't try further seeds
                if metrics["status"] in {"ER", "TO"}:
                    break

            # Calculate mean and standard deviation. Guarded by how many
            # runtimes were actually collected, not the requested
            # `num_seeds`: an error/timeout on the first repetition breaks
            # the loop above early, leaving a single-element `runtimes`
            # even when `num_seeds` > 1, and stdev requires 2+ points.
            if len(runtimes) > 1:
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
                mean_stddev_csv, problem["problem_id"], metrics, run_id, timestamp
            )

            run_results[
                (problem["problem_id"], solver_configuration, solver_version)
            ] = metrics

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
                    reference_metrics = run_reference_highs_binary()

                    # Add required fields to reference metrics
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

    return run_results

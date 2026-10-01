"""Unified CLI for running benchmark problems.

Runs problems against solver configurations across one or more
solver-version years.

A package module invoked via `python -m runner.benchmark`, run from the repo root.
"""

import time
from pathlib import Path
from socket import gethostname

import typer
import yaml

from .utils import alerts, config, env
from .utils.orchestrator import BenchmarkRunError, run_benchmark

app = typer.Typer(add_completion=False)


def _eligible_configurations_for_problems(
    problems_yaml_path: Path,
    solver_configurations: list[str],
    year: str,
) -> list[str]:
    """Return configurations eligible for at least one problem in a run."""
    with problems_yaml_path.open() as f:
        content = yaml.safe_load(f) or {}

    problems = content.get("problems", {})

    return [
        solver_configuration
        for solver_configuration in solver_configurations
        if any(
            config.is_solver_eligible(
                solver_configuration,
                year,
                size_category=problem.get("Size"),
                problem_class=problem.get("Problem class"),
            )
            for problem in problems.values()
        )
    ]


@app.command()
def run(
    problems_yaml_path: Path = typer.Argument(
        ..., help="Path to the problems YAML file."
    ),
    years: list[str] = typer.Option(
        None,
        "--years",
        "-y",
        help='Solver-version year to run (repeatable), or "tests" for the '
        "shared CI smoke-test env. Defaults to every year with a "
        "registered solver version.",
    ),
    solver_configurations: list[str] = typer.Option(
        None,
        "--solver-configurations",
        "-s",
        help="Solver configuration to run (repeatable), e.g. `highs-default` "
        "or `highs-hipo`. Defaults to solver_configurations.yaml's "
        "default_configurations.",
    ),
    append: bool = typer.Option(
        False,
        "--append",
        "-a",
        help="Append to the results CSVs instead of overwriting them.",
    ),
    num_seeds: int = typer.Option(
        1,
        "--num-seeds",
        "-n",
        min=1,
        help="Number of seeds to try per (problem, solver configuration) "
        "pair. When greater than 1, each repetition uses a different seed "
        "(1, 2, 3, ...) instead of the configuration's own fixed seed, to "
        "gauge the solver's sensitivity to it (see "
        "`runner/config/solvers.yaml`'s `seed_options`). Default: 1 (the "
        "configuration's own fixed seed, no repetition).",
    ),
    ref_bench_interval: int = typer.Option(
        0,
        "--ref-bench-interval",
        "-r",
        help="Run a reference benchmark at most once every N seconds. 0 disables it.",
    ),
    run_id: str = typer.Option(
        None,
        "--run-id",
        "-u",
        help="Identifier shared by every row from this run. "
        "Auto-generated from the current time and hostname if not given.",
    ),
) -> None:
    """Run every problem in PROBLEMS_YAML_PATH against each solver configuration.

    Runs them for each given year.

    First installs any missing per-solver-year envs (see `runner/envs/`).
    Then, for each problem in turn, runs every registered and eligible
    (year, solver configuration) pair on it in a random order (see
    `orchestrator.run_benchmark`). A year with no registered solver version
    for any requested configuration, or a solver run that crashes, is logged
    and skipped rather than aborting the rest of the run; the command then
    exits with status 1 once everything else has run.
    """
    resolved_solver_configurations = (
        list(solver_configurations)
        if solver_configurations
        else config.get_default_configurations()
    )
    for configuration in resolved_solver_configurations:
        if config.get_solver_configuration(configuration) is None:
            print(
                f"WARNING: {configuration} is not in solver_configurations.yaml; "
                "it will run with the solver's own defaults (no tuning options)"
            )
    resolved_years = list(years) if years else config.get_all_registered_years()
    resolved_run_id = (
        run_id or f"{time.strftime('%Y%m%d_%H%M%S', time.gmtime())}_{gethostname()}"
    )
    print(f"Using run ID: {resolved_run_id}")

    failed = False
    runnable_years = []
    for year in resolved_years:
        registered_versions = env.get_registered_solver_versions(
            resolved_solver_configurations, year
        )
        if not registered_versions:
            print(
                f"ERROR: no registered solver version for any of "
                f"{', '.join(resolved_solver_configurations)} in year {year}"
            )
            alerts.print_alert(
                "ER", year=year, run_id=resolved_run_id, host=gethostname()
            )
            failed = True
            continue

        # A registered solver can still be ineligible for every problem in
        # this run, e.g. by size or problem class: skip the year rather than
        # installing its envs for nothing
        eligible_configurations = _eligible_configurations_for_problems(
            problems_yaml_path, list(registered_versions), year
        )
        if not eligible_configurations:
            print(
                f"No requested solver configurations are eligible for year {year}. "
                "Skipping."
            )
            continue

        env.ensure_solver_envs_installed(
            {
                configuration: registered_versions[configuration]
                for configuration in eligible_configurations
            }
        )
        runnable_years.append(year)

    if runnable_years:
        print(f"Running the benchmark for year(s) {', '.join(runnable_years)}...")
        try:
            run_benchmark(
                problems_yaml_path,
                resolved_solver_configurations,
                years=runnable_years,
                num_seeds=num_seeds,
                reference_interval=ref_bench_interval,
                append=append,
                run_id=resolved_run_id,
            )
        except Exception as e:
            print(f"ERROR running the benchmark: {e}")
            # BenchmarkRunError means some solver runs crashed, and each has
            # already alerted (see orchestrator.py); alert for anything else
            if not isinstance(e, BenchmarkRunError):
                alerts.print_alert("ER", run_id=resolved_run_id, host=gethostname())
            failed = True

    if failed:
        print(f"ERROR: the benchmark failed for run ID {resolved_run_id}")
        raise typer.Exit(code=1)
    print(f"All years completed for run ID: {resolved_run_id}")


if __name__ == "__main__":
    app()

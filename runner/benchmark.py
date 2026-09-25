"""Unified CLI for running benchmark problems.

Runs problems against solver configurations across one or more
solver-version years.

A package module invoked via `python -m runner.benchmark`, run from the repo root.
"""

import time
from pathlib import Path
from socket import gethostname

import typer

from .utils import config, env
from .utils.orchestrator import run_benchmark

app = typer.Typer(add_completion=False)


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
        help="Append to the results CSVs instead of overwriting them for "
        "the first year.",
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

    Runs them once per given year.

    For each year, installs any missing per-solver-year envs (see
    `runner/envs/`), then runs that year's registered and eligible solver
    configurations against every problem. A failing year, or one with no
    registered solver version for any requested configuration, is logged
    and skipped rather than aborting the remaining years; the command then
    exits with status 1 once every year has been attempted.
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

    failed_years = []
    for index, year in enumerate(resolved_years):
        print(f"Running the benchmark for year {year}...")

        try:
            registered_versions = env.get_registered_solver_versions(
                resolved_solver_configurations, year
            )
            if not registered_versions:
                raise ValueError(
                    "no registered solver version for any of "
                    f"{', '.join(resolved_solver_configurations)}"
                )
            env.ensure_solver_envs_installed(registered_versions)
            run_benchmark(
                problems_yaml_path,
                resolved_solver_configurations,
                year=year,
                num_seeds=num_seeds,
                reference_interval=ref_bench_interval,
                append=append or index > 0,
                run_id=resolved_run_id,
            )
        except Exception as e:
            print(f"ERROR running the benchmark for year {year}: {e}")
            failed_years.append(year)
            continue

        print(f"Completed the benchmark for year {year}")

    if failed_years:
        print(
            f"ERROR: the benchmark failed for year(s) {', '.join(failed_years)} "
            f"of run ID {resolved_run_id}"
        )
        raise typer.Exit(code=1)
    print(f"All years completed for run ID: {resolved_run_id}")


if __name__ == "__main__":
    app()

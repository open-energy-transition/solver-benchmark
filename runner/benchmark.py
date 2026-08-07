"""Unified CLI for running problems against solver configurations across one
or more solver-version years.

Replaces the old `runner/run_benchmarks.py` (single-year CLI) and
`runner/benchmark_all.sh` (multi-year loop plus per-solver conda env setup)
with one Python entrypoint. A package module, not a bare script: invoke via
`python -m runner.benchmark`, run from the repo root.
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
        help="Solver configuration to run (repeatable), e.g. `highs` or "
        "`highs-hipo`. Defaults to solver_configurations.yaml's "
        "default_configurations.",
    ),
    append: bool = typer.Option(
        False,
        "--append",
        "-a",
        help="Append to the results CSVs instead of overwriting them for "
        "the first year.",
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
    """Run every problem in PROBLEMS_YAML_PATH against each solver
    configuration, once per given year.

    For each year, creates any missing per-solver-year conda envs (see
    `runner/envs/`), then runs that year's registered and eligible solver
    configurations against every problem. A failing year is logged and
    skipped rather than aborting the remaining years.
    """
    resolved_solver_configurations = (
        list(solver_configurations)
        if solver_configurations
        else config.get_default_configurations()
    )
    resolved_years = list(years) if years else config.get_all_registered_years()
    resolved_run_id = run_id or f"{time.strftime('%Y%m%d_%H%M%S')}_{gethostname()}"
    print(f"Using run ID: {resolved_run_id}")

    for index, year in enumerate(resolved_years):
        print(f"Running the benchmark for year {year}...")

        registered_versions = env.get_registered_solver_versions(
            resolved_solver_configurations, year
        )
        env.ensure_solver_envs_installed(registered_versions)

        try:
            run_benchmark(
                problems_yaml_path,
                resolved_solver_configurations,
                year=year,
                reference_interval=ref_bench_interval,
                append=append or index > 0,
                run_id=resolved_run_id,
            )
        except Exception as e:
            print(f"ERROR running the benchmark for year {year}: {e}")
            continue

        print(f"Completed the benchmark for year {year}")

    print(f"All years completed for run ID: {resolved_run_id}")


if __name__ == "__main__":
    app()

"""CLI entrypoint for `orchestrator.run_benchmark`.

A package module (not a bare script) since it needs `runner.utils`
importable as a package -- invoke via `python -m runner.run_benchmarks`,
run from the repo root. See `execution.py`'s module docstring for the same
constraint on `solver.py`.
"""

import argparse

from .utils import config
from .utils.orchestrator import run_benchmark


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the problems specified in the given file."
    )
    parser.add_argument(
        "problems_yaml_path", type=str, help="Path to the problems YAML file."
    )
    parser.add_argument(
        "year",
        type=str,
        help="Denote the problems as having been run on solvers from given year.",
    )
    parser.add_argument(
        "--solvers",
        type=str,
        nargs="+",
        default=config.get_default_configurations(),
        help=(
            "The list of solver configurations to run. Configurations not "
            "eligible or not registered for the given year are skipped "
            "(see runner/config/eligibility_rules.yaml and solvers.yaml)."
        ),
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
        help="Run a reference benchmark in between problems, at most once every given number of seconds.",
    )
    parser.add_argument(
        "--run_id",
        type=str,
        default=None,
        help="Unique identifier for this benchmark run.",
    )
    args = parser.parse_args()

    run_benchmark(
        args.problems_yaml_path,
        args.solvers,
        args.year,
        reference_interval=args.ref_bench_interval,
        append=args.append,
        run_id=args.run_id,
    )
    print("Benchmarking complete.")


if __name__ == "__main__":
    main()

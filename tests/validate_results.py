#!/usr/bin/env python3
"""
Check that each benchmark instance has been run on the expected number of
solvers, and flag any instance missing from the results entirely.

Cross-references results/benchmark_results.csv against results/metadata.yaml:
each metadata instance is bucketed by size category (short-timeout S/M vs.
long-timeout L) and problem class (LP vs. MILP), and the set of solver
versions run against it is checked for consistency against the other
instances in the same bucket.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

import pandas as pd
import yaml


def bucket_instances_by_timeout(
    instances: dict[str, Any],
) -> tuple[set[str], set[str], set[str]]:
    """
    Split instance IDs into short-timeout, long-timeout, and skipped sets.

    Parameters
    ----------
    instances : dict
        The "instances" map from a parsed metadata YAML file.

    Returns
    -------
    tuple[set[str], set[str], set[str]]
        (short_timeout_ids, long_timeout_ids, skipped_ids). "S"/"M" sized
        instances are short-timeout, "L" sized instances are long-timeout;
        an instance with a "Skip because" value is added to skipped_ids
        regardless of size.

    Raises
    ------
    ValueError
        If an instance has an unrecognized "Size" value.
    """
    short_timeout_ids: set[str] = set()
    long_timeout_ids: set[str] = set()
    skipped_ids: set[str] = set()

    for instance_id, instance in instances.items():
        if instance["Size"] == "L":
            long_timeout_ids.add(instance_id)
        elif instance["Size"] in ["S", "M"]:
            short_timeout_ids.add(instance_id)
        else:
            print(
                f"::warning file=tests/validate_results.py::ERROR: Unknown size {instance['Size']}"
            )
            raise ValueError(f"Unknown size {instance['Size']}")
        if instance.get("Skip because") is not None:
            skipped_ids.add(instance_id)

    return short_timeout_ids, long_timeout_ids, skipped_ids


def expected_solver_count(problem_class: str, is_long_timeout: bool) -> int:
    """
    Return the expected number of distinct solver-versions for a bucket.

    Parameters
    ----------
    problem_class : str
        "LP" or "MILP" (any other value falls back to the LP count).
    is_long_timeout : bool
        Whether this instance is in the long-timeout ("L" sized) bucket.

    Returns
    -------
    int
        Expected count of distinct solver-version combinations.
    """
    if is_long_timeout:
        return 4 if problem_class == "MILP" else 6
    return 15 if problem_class == "MILP" else 17


def check_consistent_solver_set(
    label: str, solvers_present: set[str], expected: Optional[str]
) -> str:
    """
    Verify the solver set for one instance matches the bucket's reference set.

    Parameters
    ----------
    label : str
        Bucket label used in error messages (e.g. "short LP").
    solvers_present : set[str]
        Solver-version strings observed for this instance.
    expected : str, optional
        The reference solver set (as `str(set)`) seen so far for this
        bucket, or None if this is the first instance checked in it.

    Returns
    -------
    str
        The reference solver set to carry forward (unchanged if it already
        matched).

    Raises
    ------
    ValueError
        If `solvers_present` doesn't match a pre-existing reference set.
    """
    observed = str(solvers_present)
    if expected is None:
        return observed
    if expected != observed:
        print(
            f"::warning file=tests/validate_results.py::ERROR: Unexpected {label} solvers: {solvers_present}"
        )
        raise ValueError(f"Unexpected {label} solvers: {solvers_present}")
    return expected


def main() -> None:
    """Cross-check benchmark_results.csv against metadata.yaml and report."""
    data = pd.read_csv(Path(__file__).parent / "../results/benchmark_results.csv")
    meta = yaml.safe_load(open("results/metadata.yaml"))

    short_timeout_ids, long_timeout_ids, skipped_ids = bucket_instances_by_timeout(
        meta["instances"]
    )

    short_solvers_lp: Optional[str] = None
    short_solvers_milp: Optional[str] = None
    long_solvers_lp: Optional[str] = None
    long_solvers_milp: Optional[str] = None

    data["bench-size"] = data["Benchmark"] + "-" + data["Size"]
    data["solver-version"] = data["Solver"] + "-" + data["Solver Version"]

    # Check that every bench-size instance has metadata and the same set of solvers run on it
    seen_ids: set[str] = set()
    for (bench, size), group in data.groupby(["Benchmark", "Size"]):
        instance_id = bench + "-" + size
        solvers_present = set(sorted(group["solver-version"].unique()))

        if instance_id in short_timeout_ids:
            problem_class = meta["instances"][instance_id].get("Problem class", "")
            expected = expected_solver_count(problem_class, is_long_timeout=False)
            assert len(solvers_present) == expected, (
                f"expected {expected}, found {len(solvers_present)} solvers in results for {instance_id} ({problem_class})"
            )
            if problem_class == "LP":
                short_solvers_lp = check_consistent_solver_set(
                    "short LP", solvers_present, short_solvers_lp
                )
            elif problem_class == "MILP":
                short_solvers_milp = check_consistent_solver_set(
                    "short MILP", solvers_present, short_solvers_milp
                )
        elif instance_id in long_timeout_ids:
            problem_class = meta["instances"][instance_id].get("Problem class", "")
            expected = expected_solver_count(problem_class, is_long_timeout=True)
            assert len(solvers_present) == expected, (
                f"expected {expected}, found {len(solvers_present)} solvers in results for {instance_id} ({problem_class})"
            )
            if problem_class == "LP":
                long_solvers_lp = check_consistent_solver_set(
                    "long LP", solvers_present, long_solvers_lp
                )
            elif problem_class == "MILP":
                long_solvers_milp = check_consistent_solver_set(
                    "long MILP", solvers_present, long_solvers_milp
                )
        else:
            print(
                f"::warning file=tests/validate_results.py::ERROR: Unknown benchmark {instance_id}"
            )
            raise ValueError(f"Unknown benchmark {instance_id}")
        seen_ids.add(instance_id)

    print(f"Solvers run on short LP benchmarks:\n{short_solvers_lp}")
    print(f"Solvers run on short MILP benchmarks:\n{short_solvers_milp}")
    print(f"Solvers run on long LP benchmarks:\n{long_solvers_lp}")
    print(f"Solvers run on long MILP benchmarks:\n{long_solvers_milp}")

    # Check that no instance from metadata is missing from the results
    missing_ids = (short_timeout_ids | long_timeout_ids) - seen_ids - skipped_ids
    if missing_ids:
        print(
            "::warning file=tests/validate_results.py::ERROR: couldn't find these benchs in the results:"
        )
        print(
            f"::warning file=tests/validate_results.py::ERROR: Missing benchmarks: {missing_ids}"
        )


if __name__ == "__main__":
    main()

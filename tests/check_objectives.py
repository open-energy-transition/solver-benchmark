"""Check that the solvers agree on the objective value of each problem.

Reads `results/benchmark_results.csv` and, for every problem, compares the
objective values of the runs with status "ok" across solvers. A run is flagged
when its objective differs from the consensus of the other solvers by more than
a relative tolerance, which is looser for MILPs (solved to a MIP gap) than for
LPs. The problem class (LP or MILP) comes from `results/metadata.yaml`.

Run it after a campaign:

    python tests/check_objectives.py [results.csv] [--output flags.csv]

Notes
-----
Only the standard library is needed, plus PyYAML to read the metadata.

Each solver *family* gets one vote: the part of the solver name before the first
hyphen, so `highs`, `highs-hipo` and `highs-ipx` count once. The family's value
is the median objective of its runs from the latest release year. The families
are grouped into clusters of values that agree within the tolerance, and the
largest cluster is the consensus. Every run is then compared with the median of
the consensus values of the *other* families, so all versions of a solver are
checked, but none is its own reference.

The status of a run is one of:

- `agree`: within the tolerance of the consensus;
- `outlier`: differs from the consensus, which has a unique largest cluster;
- `disagree_no_majority`: two or more clusters tie for the largest (for example
  two solvers that disagree), so nobody can be singled out; all their runs are
  flagged;
- `no_reference`: only one family has an "ok" run; reported, not flagged.

A flag means "investigate", not "this solver is wrong": the minority can be the
correct side.
"""

from __future__ import annotations

import argparse
import csv
import math
import statistics
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import yaml

DEFAULT_LP_TOL = 1e-5
DEFAULT_MILP_TOL = 1e-3
FLAGGED = ("outlier", "disagree_no_majority")
FIELDS = [
    "Problem",
    "Problem class",
    "Solver",
    "Solver Version",
    "Objective Value",
    "Reference",
    "Relative difference",
    "Tolerance",
    "Status",
]


def solver_family(solver: str) -> str:
    """Return the solver family: the solver name up to the first hyphen."""
    return solver.split("-", 1)[0]


def rel_diff(value: float, reference: float) -> float:
    """Return `|value - reference| / max(1, |reference|)`."""
    return abs(value - reference) / max(1.0, abs(reference))


def load_problem_classes(metadata_path: Path | None) -> dict[str, str]:
    """Read the problem class ("LP" or "MILP") of each problem from the metadata.

    Parameters
    ----------
    metadata_path : Path or None
        Path of `results/metadata.yaml`; None or a missing file gives no classes.

    Returns
    -------
    dict[str, str]
        Problem ID to problem class; problems without a class are left out.
    """
    if metadata_path is None or not metadata_path.exists():
        return {}
    with metadata_path.open() as f:
        problems = yaml.safe_load(f)["problems"]
    return {
        pid: p["Problem class"] for pid, p in problems.items() if p.get("Problem class")
    }


def read_ok_runs(results_path: Path) -> list[dict[str, Any]]:
    """Read the runs with status "ok" and a finite objective from a results CSV.

    Parameters
    ----------
    results_path : Path
        A benchmark results CSV with a "Problem" column, or the historical
        "Benchmark" and "Size" columns.

    Returns
    -------
    list[dict]
        One dict per run with `problem`, `solver`, `version`, `year` and `obj`.
    """
    runs = []
    with results_path.open(newline="") as f:
        for row in csv.DictReader(f):
            if row["Status"] != "ok":
                continue
            try:
                obj = float(row["Objective Value"])
            except ValueError:
                continue
            if not math.isfinite(obj):
                continue
            problem = row.get("Problem") or f"{row['Benchmark']}-{row['Size']}"
            try:
                year = float(row["Solver Release Year"])
            except ValueError:
                year = float("-inf")
            runs.append(
                {
                    "problem": problem,
                    "solver": row["Solver"],
                    "version": row["Solver Version"],
                    "year": year,
                    "obj": obj,
                }
            )
    return runs


def cluster(values: dict[str, float], tol: float) -> list[list[str]]:
    """Group families whose values lie within `tol` of their cluster's first value.

    Values are sorted and each cluster is anchored at its smallest value, so the
    two ends of a cluster are never further apart than the tolerance (no
    chaining).

    Parameters
    ----------
    values : dict[str, float]
        Family to value.
    tol : float
        Relative tolerance.

    Returns
    -------
    list[list[str]]
        The clusters, largest first; each is a sorted list of families.
    """
    ordered = sorted(values, key=lambda k: values[k])
    clusters: list[list[str]] = []
    for fam in ordered:
        if clusters:
            first = values[clusters[-1][0]]
            if abs(values[fam] - first) / max(1.0, abs(first), abs(values[fam])) <= tol:
                clusters[-1].append(fam)
                continue
        clusters.append([fam])
    return sorted((sorted(c) for c in clusters), key=lambda c: (-len(c), c))


def check_problem(
    runs: list[dict[str, Any]], tol: float
) -> tuple[list[dict[str, Any]], list[list[str]]]:
    """Classify every "ok" run of one problem against the other solvers.

    Parameters
    ----------
    runs : list[dict]
        The runs of one problem, as returned by `read_ok_runs`.
    tol : float
        Relative tolerance for the problem's class.

    Returns
    -------
    tuple[list[dict], list[list[str]]]
        The runs with `status`, `reference` and `diff` added, and the clusters
        of solver families (largest first).
    """
    by_family: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for run in runs:
        by_family[solver_family(run["solver"])].append(run)
    family_value = {}
    for fam, fam_runs in by_family.items():
        latest = max(r["year"] for r in fam_runs)
        family_value[fam] = statistics.median(
            r["obj"] for r in fam_runs if r["year"] == latest
        )
    clusters = cluster(family_value, tol)

    checked = []
    if len(by_family) < 2:
        status, tied = "no_reference", False
    else:
        tied = len(clusters) > 1 and len(clusters[0]) == len(clusters[1])
        status = ""
    consensus = set() if tied else set(clusters[0])
    for run in runs:
        out = {**run, "reference": None, "diff": None}
        fam = solver_family(run["solver"])
        if status:
            out["status"] = status
        elif tied:
            out["status"] = "disagree_no_majority"
        else:
            others = [family_value[f] for f in consensus if f != fam]
            out["reference"] = statistics.median(others)
            out["diff"] = rel_diff(run["obj"], out["reference"])
            out["status"] = "agree" if out["diff"] <= tol else "outlier"
        checked.append(out)
    return checked, clusters


def check_results(
    runs: list[dict[str, Any]],
    classes: dict[str, str],
    lp_tol: float = DEFAULT_LP_TOL,
    milp_tol: float = DEFAULT_MILP_TOL,
) -> tuple[list[dict[str, Any]], dict[str, list[list[str]]]]:
    """Check every problem in `runs`.

    Parameters
    ----------
    runs : list[dict]
        The runs from `read_ok_runs`.
    classes : dict[str, str]
        Problem ID to "LP" or "MILP". A problem without a class is checked with
        the MILP tolerance, so that it can't produce a false flag.
    lp_tol, milp_tol : float
        Relative tolerances.

    Returns
    -------
    tuple[list[dict], dict[str, list[list[str]]]]
        Output rows (keys of `FIELDS`) and, for each problem with more than one
        cluster, its clusters.
    """
    by_problem: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for run in runs:
        by_problem[run["problem"]].append(run)
    rows, split = [], {}
    for problem in sorted(by_problem):
        cls = classes.get(problem, "unknown")
        tol = lp_tol if cls == "LP" else milp_tol
        checked, clusters = check_problem(by_problem[problem], tol)
        if len(clusters) > 1:
            split[problem] = clusters
        rows.extend(
            {
                "Problem": problem,
                "Problem class": cls,
                "Solver": r["solver"],
                "Solver Version": r["version"],
                "Objective Value": repr(r["obj"]),
                "Reference": "" if r["reference"] is None else repr(r["reference"]),
                "Relative difference": (
                    "" if r["diff"] is None else f"{r['diff']:.3e}"
                ),
                "Tolerance": tol,
                "Status": r["status"],
            }
            for r in sorted(checked, key=lambda r: (r["solver"], r["year"]))
        )
    return rows, split


def summarize(rows: list[dict[str, Any]], split: dict[str, list[list[str]]]) -> str:
    """Return a Markdown summary: counts per status and the flagged runs."""
    counts: dict[str, int] = defaultdict(int)
    for r in rows:
        counts[r["Status"]] += 1
    lines = [
        "## Cross-solver objective check",
        "",
        f"{len(rows)} ok runs on {len({r['Problem'] for r in rows})} problems: "
        + ", ".join(f"{n} {s}" for s, n in sorted(counts.items())),
        "",
    ]
    unknown = {r["Problem"] for r in rows if r["Problem class"] == "unknown"}
    if unknown:
        lines += [f"{len(unknown)} problems have no class: MILP tolerance used.", ""]
    flagged = [r for r in rows if r["Status"] in FLAGGED]
    if flagged:
        lines += [
            "| Problem | Class | Solver | Version | Objective | Reference | Rel. diff | Status |",
            "|---|---|---|---|---|---|---|---|",
        ]
        lines += [
            f"| {r['Problem']} | {r['Problem class']} | {r['Solver']} "
            f"| {r['Solver Version']} | {r['Objective Value']} | {r['Reference']} "
            f"| {r['Relative difference']} | {r['Status']} |"
            for r in flagged
        ]
    else:
        lines.append("No run is flagged.")
    if split:
        lines += [
            "",
            "### Problems where the solver families split into groups",
            "",
            "| Problem | Groups (largest first) |",
            "|---|---|",
        ]
        lines += [
            f"| {pid} | {' / '.join(', '.join(c) for c in groups)} |"
            for pid, groups in sorted(split.items())
        ]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    """Run the check from the command line and return the exit code."""
    root = Path(__file__).resolve().parent.parent
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument(
        "results",
        nargs="?",
        type=Path,
        default=root / "results" / "benchmark_results.csv",
    )
    p.add_argument("--metadata", type=Path, default=root / "results" / "metadata.yaml")
    p.add_argument("--lp-tol", type=float, default=DEFAULT_LP_TOL)
    p.add_argument("--milp-tol", type=float, default=DEFAULT_MILP_TOL)
    p.add_argument("--output", type=Path, help="write every checked run to this CSV")
    p.add_argument(
        "--fail-on-flag", action="store_true", help="exit 1 if a run is flagged"
    )
    args = p.parse_args(argv)

    rows, split = check_results(
        read_ok_runs(args.results),
        load_problem_classes(args.metadata),
        args.lp_tol,
        args.milp_tol,
    )
    if args.output:
        with args.output.open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=FIELDS)
            w.writeheader()
            w.writerows(rows)
    sys.stdout.write(summarize(rows, split))
    flagged = any(r["Status"] in FLAGGED for r in rows)
    return 1 if args.fail_on_flag and flagged else 0


if __name__ == "__main__":
    sys.exit(main())

"""The benchmark-results CSV schema: what a result record looks like, and how
it's written to disk.

Kept separate from `execution.py` because "what a result record looks like"
and "how a solver process is run" are independent concerns that change for
different reasons.

New results are written with a "Problem" column (matching metadata.yaml's
"problems" nomenclature). Historical CSVs used "Benchmark" instead -- see
`analyze.load_results`, which normalizes both to "Problem" on read.
"""

import csv
from collections import OrderedDict
from pathlib import Path
from typing import Any

# Single source of truth for the mean/stddev summary CSV's columns, shared by
# `write_csv_headers` and `write_csv_summary_row` so the two can't drift
# apart (mirrors how `csv_record` is the one source of truth for the main
# results CSV's columns).
_MEAN_STDDEV_HEADERS = [
    "Problem",
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
    "Seed",
]


def csv_record(check: bool = False, **kwargs: Any) -> OrderedDict[str, Any]:
    """Build one benchmark-results row, mapping kwargs to their CSV column names.

    Parameters
    ----------
    check : bool, optional
        If True, raise if any column ends up with a None value. Used when
        writing a real result row (every field should be known by then);
        left False when only inspecting the schema (e.g. for headers).
    **kwargs : Any
        Values keyed by their internal name (e.g. `problem_id`, `solver`,
        `condition`, `runtime`, ...), not their CSV column name. Any kwarg
        not recognized below is silently ignored; any recognized one that's
        missing defaults to None.

    Returns
    -------
    OrderedDict[str, Any]
        One row, keyed by CSV column name in column order.

    Raises
    ------
    ValueError
        If `check` is True and any column's value is None.

    Notes
    -----
    Has no "Size" column: that held the specific instance name within a
    problem (e.g. a resolution/cluster-count like "100-12h" for a
    multi-instance problem family), which is always "default" today since
    metadata.yaml is now one row per model+size combination already (see
    `metadata.load_problems`) -- nothing left to disambiguate. Historical
    CSVs still have it; `analyze.load_results` knows how to read those.

    "Seed" is appended last (not grouped with the other solver-identifying
    columns) so adding it doesn't shift every other column's position --
    see `ensure_csv_schema` for how an existing CSV predating this column
    is widened to include it. Empty for a single-seed run (the
    configuration's own fixed seed applies); set to the actual seed used
    when `orchestrator.run_benchmark`'s `num_seeds` > 1 varies it per
    repetition.
    """
    record = OrderedDict(
        [
            ("Problem", kwargs.get("problem_id")),
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
            ("Seed", kwargs.get("seed")),
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
    headers: Any = csv_record(check=False).keys(),
) -> None:
    """Create (or overwrite) both result CSVs with just their header rows.

    Parameters
    ----------
    results_csv : Path
        Per-iteration results file to initialize.
    mean_stddev_csv : Path
        Mean/stddev-across-iterations summary file to initialize.
    headers : Any, optional
        Column names for `results_csv`. Defaults to `csv_record`'s own
        column order, so the two always stay in sync.
    """
    with open(results_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(headers)

    with open(mean_stddev_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(_MEAN_STDDEV_HEADERS)


def ensure_csv_schema(
    results_csv: Path,
    mean_stddev_csv: Path,
    append: bool,
) -> None:
    """Prepare both result CSVs for a run, without losing `--append` history.

    The single entry point `orchestrator.run_benchmark` should call instead
    of `write_csv_headers` directly: it only overwrites when there's nothing
    to preserve (`append` is False, or a file doesn't exist yet), and
    otherwise widens an existing file to the current schema in place -- see
    `_migrate_columns_if_needed` -- so appending to a CSV written by an older
    version of this code (missing a column added since, e.g. `Seed`) doesn't
    produce a ragged file that `pd.read_csv` can't parse.

    Parameters
    ----------
    results_csv : Path
        Per-iteration results file.
    mean_stddev_csv : Path
        Mean/stddev-across-iterations summary file.
    append : bool
        If False, both files are (re)created with just a header row,
        discarding any existing content -- same as `write_csv_headers`.
        If True and both files already exist, they're widened in place if
        their schema is out of date, and otherwise left untouched.
    """
    if not append or not results_csv.exists() or not mean_stddev_csv.exists():
        write_csv_headers(results_csv, mean_stddev_csv)
        return

    _migrate_columns_if_needed(results_csv, list(csv_record(check=False).keys()))
    _migrate_columns_if_needed(mean_stddev_csv, _MEAN_STDDEV_HEADERS)


def _migrate_columns_if_needed(csv_path: Path, expected_headers: list[str]) -> None:
    """Widen an existing CSV to `expected_headers`, in place, preserving rows.

    A no-op if `csv_path`'s header already matches `expected_headers`
    exactly (the common case, checked cheaply before reading the rest of
    the file). Otherwise, only ever *adds* columns: an existing row missing
    a column that's new in `expected_headers` gets an empty cell for it,
    and every column and value it already had is preserved as-is. Never
    reorders or drops a column `csv_path` already has, so no existing data
    is silently lost.

    Parameters
    ----------
    csv_path : Path
        The results or mean/stddev CSV to check, and migrate if needed.
    expected_headers : list[str]
        The column names this run's code expects, in order (see
        `csv_record` and `_MEAN_STDDEV_HEADERS`).

    Raises
    ------
    ValueError
        If `csv_path` has a column not in `expected_headers` -- silently
        dropping it would lose data, so this needs a deliberate decision
        (e.g. renaming the column, or updating `expected_headers`) rather
        than an automatic one.
    """
    with open(csv_path, newline="") as file:
        reader = csv.DictReader(file)
        current_headers = reader.fieldnames or []
        if list(current_headers) == expected_headers:
            return

        unexpected = [h for h in current_headers if h not in expected_headers]
        if unexpected:
            raise ValueError(
                f"{csv_path} has column(s) {unexpected} not in the current "
                "schema -- resolve manually rather than risk silently "
                "dropping data."
            )
        rows = list(reader)

    added = [h for h in expected_headers if h not in current_headers]
    print(f"Migrating {csv_path} to the current schema (adding {added})")
    with open(csv_path, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=expected_headers, restval="")
        writer.writeheader()
        writer.writerows(rows)


def write_csv_row(
    results_csv: Path,
    problem_id: str,
    metrics: dict[str, Any],
    run_id: str,
    timestamp: str,
    vm_instance_type: str,
    vm_zone: str,
    hostname: str,
    solver_benchmark_version: str,
) -> None:
    """Append one result row to `results_csv`.

    Parameters
    ----------
    results_csv : Path
        File to append to; must already have a header row (see
        `write_csv_headers`).
    problem_id : str
        The problem's identifier.
    metrics : dict[str, Any]
        A single solver run's metrics, keyed as `csv_record` expects (e.g.
        `size`, `solver`, `status`, `runtime`, ...).
    run_id : str
        Identifier shared by every row from the same benchmark run.
    timestamp : str
        When this specific solver run started.
    vm_instance_type : str
        The machine type this ran on (or "unknown" if undetectable).
    vm_zone : str
        The cloud zone this ran in (or "unknown" if undetectable/local).
    hostname : str
        The machine's hostname.
    solver_benchmark_version : str
        The solver-benchmark repo's own git commit hash at run time.

    Notes
    -----
    Column order must match `write_csv_headers`'s; both derive from
    `csv_record` so they can't drift independently.
    """
    with open(results_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            csv_record(
                check=False,  # allow None values
                **metrics,
                run_id=run_id,
                timestamp=timestamp,
                problem_id=problem_id,
                vm_instance_type=vm_instance_type,
                vm_zone=vm_zone,
                solver_benchmark_version=solver_benchmark_version,
                hostname=hostname,
            ).values()
        )


def write_csv_summary_row(
    mean_stddev_csv: Path,
    problem_id: str,
    metrics: dict[str, Any],
    run_id: str,
    timestamp: str,
) -> None:
    """Append one mean/stddev-across-iterations row to `mean_stddev_csv`.

    Parameters
    ----------
    mean_stddev_csv : Path
        File to append to; must already have a header row (see
        `write_csv_headers`).
    problem_id : str
        The problem's identifier.
    metrics : dict[str, Any]
        Must include `solver`, `solver_version`, `solver_release_year`,
        `status`, `condition`, `runtime_mean`, `runtime_stddev`,
        `memory_mean`, `memory_stddev`, `objective` -- typically the last
        iteration's status/condition/objective, alongside statistics
        computed across all iterations.
    run_id : str
        Identifier shared by every row from the same benchmark run.
    timestamp : str
        When the last iteration started.

    Notes
    -----
    Column order must match `_MEAN_STDDEV_HEADERS` (also used by
    `write_csv_headers`). `Seed` (like `status`/`condition`) reflects only
    the last iteration's value, not every seed tested across iterations --
    see `orchestrator.run_benchmark`'s own docstring.
    """
    with open(mean_stddev_csv, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                problem_id,
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
                metrics.get("seed"),
            ]
        )

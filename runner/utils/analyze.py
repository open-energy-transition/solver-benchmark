"""Load benchmark results from disk and compute summary statistics over them."""

from pathlib import Path

import numpy as np
import pandas as pd
from IPython.display import display


def load_results(folder: str | list[str]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load all CSV files in `folder`. Returns the results and variability dataframes.

    Parameters
    ----------
    folder : str | list[str]
        One or more directories to glob `*.csv` files from.

    Returns
    -------
    tuple[pd.DataFrame, pd.DataFrame]
        `(results, variability)`: `results` is every non-reference-benchmark
        row across all CSVs, with only the latest run kept per problem;
        `variability` is per-VM runtime statistics computed from the
        reference-benchmark rows (used to gauge cross-VM noise).

    Notes
    -----
    Normalizes historical CSVs' "Benchmark" column to "Problem" on load, so
    old and new result files can be mixed in the same `folder`.
    """
    folders = folder if isinstance(folder, list) else [folder]
    csv_files = [p for f in folders for p in Path(f).glob("*.csv")]
    results = pd.concat([pd.read_csv(p) for p in csv_files]).reset_index(drop=True)

    if "Benchmark" in results.columns:
        # Historical CSVs identified a row by "Benchmark" (a model family
        # name shared across multiple "Size" instances of that family) plus
        # "Size" (the specific instance within it). Current CSVs already
        # write one specific instance per row, so "Problem" alone uniquely
        # identifies it. Fold Size into Problem for old rows only, so every
        # row is identified by "Problem" alone from here on, regardless of
        # which format it was loaded from.
        old_format = results["Benchmark"].notna()
        results.loc[old_format, "Problem"] = (
            results.loc[old_format, "Benchmark"] + "-" + results.loc[old_format, "Size"]
        )
        results = results.drop(columns=["Benchmark"])

    # Remove reference benchmark
    reference_results = results.query('Problem == "reference-benchmark"')
    results = results.query('Problem != "reference-benchmark"').copy()

    # Find the variability of each VM
    variability = reference_results.groupby(["Hostname", "Run ID", "VM Zone"]).agg(
        {"Runtime (s)": ["count", "min", "max", "std", "mean"]}
    )
    variability["std %"] = (
        variability[("Runtime (s)", "std")] * 100 / variability[("Runtime (s)", "mean")]
    )

    # Print some basic stats
    results["solver-version"] = results["Solver"] + "-" + results["Solver Version"]
    print(f"Found {len(results)} records, {len(results['Problem'].unique())} problems")

    # Find the Run IDs and Hostnames for each problem and drop all but the latest
    # NOTE: assumes all Run IDs begin with YYYYMMDD-
    runs_grouped = results.groupby("Problem")[["Run ID", "Hostname"]]
    to_drop = set()
    for problem, group in runs_grouped:
        unique_runs = group[["Run ID", "Hostname"]].drop_duplicates()
        if len(unique_runs) > 1:
            sorted_runs = sorted(unique_runs.itertuples(index=False))
            to_drop.update([(*run, problem) for run in sorted_runs[:-1]])

    print("Dropping superceeded results from these runs:", sorted(to_drop))
    keys = pd.MultiIndex.from_frame(results[["Run ID", "Hostname", "Problem"]])
    results = results.loc[~keys.isin(to_drop)].copy()
    print(
        f"After dropping: {len(results)} records, {len(results['Problem'].unique())} problems"
    )
    return results, variability


def calculate_sgm(data_points: np.ndarray, sh: float = 10) -> float:
    """Compute the shifted geometric mean of `data_points`.

    Parameters
    ----------
    data_points : np.ndarray
        Values to average (e.g. per-problem runtimes, with timeouts
        substituted in for unsolved problems).
    sh : float, optional
        Shift applied before/after the geometric mean, to dampen the effect
        of values near zero (standard practice for runtime SGMs).

    Returns
    -------
    float
        The shifted geometric mean.
    """
    data_points = np.maximum(1, data_points + sh)
    sgm = np.exp(np.mean(np.log(data_points))) - sh
    return sgm


def is_solved(row: pd.Series) -> bool:
    """Whether a result row counts as solved.

    Parameters
    ----------
    row : pd.Series
        A single result row with a "Status" field.

    Returns
    -------
    bool
        True if `row["Status"] == "ok"`.

    Notes
    -----
    The stricter definition (`Status == "ok"` AND `Termination Condition ==
    "optimal"`) is intentionally relaxed to just `Status == "ok"` for now.
    """
    # TODO for now, relaxing to Status == 'ok'
    return row["Status"] == "ok"


def compute_summary_results(
    results_extended: pd.DataFrame, category_suffix: str = ""
) -> pd.DataFrame:
    """Summarize solved-fraction and SGM runtime per class/size/solver.

    Parameters
    ----------
    results_extended : pd.DataFrame
        Result rows with "Problem class", "Size Category", "solver-version",
        "Status", "Runtime (s)", and "Timeout" columns.
    category_suffix : str, optional
        Appended to each row's "Category" (e.g. to distinguish summaries
        computed different ways for the same size category).

    Returns
    -------
    pd.DataFrame
        One row per (Problem class, Size Category, solver-version) group,
        with "Class", "Category", "Solver", "Solved Problems" (a formatted
        "pct% (solved/total)" string), and "SGM Runtime".

    Raises
    ------
    KeyError
        If a group's "Size Category" isn't one of "S", "M", "L".
    """
    grouped = results_extended.groupby(
        ["Problem class", "Size Category", "solver-version"]
    )
    summaries = []
    for (cls, size, solver), group in grouped:
        num_solved = (is_solved(group)).sum()

        # Compute SGM using: Runtime if solved, else Timeout
        data_points = group.apply(
            lambda row: row["Runtime (s)"] if is_solved(row) else row["Timeout"],
            axis=1,
        )
        sgm_runtime = calculate_sgm(data_points.values)

        full_size = {x[0]: x for x in ["Small", "Medium", "Large"]}[size]

        num_total = group.shape[0]
        solved_frac = num_solved * 100 / num_total
        solved_problems_str = f"{solved_frac: 3.0f}% ({num_solved}/{num_total})"

        summaries.append(
            {
                "Class": cls,
                "Category": full_size + category_suffix,
                "Solver": solver,
                "Solved Problems": solved_problems_str,
                "SGM Runtime": sgm_runtime,
            }
        )
    return pd.DataFrame(summaries)


def build_gurobi_hipo_comparison_tables(
    final_with_size: pd.DataFrame,
    top_n: int = 5,
) -> None:
    """Print the largest problems solved by HiPO and by Gurobi, side by side.

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have "Benchmark_clean", "Size", "Num. variables",
        "Num. constraints", "gurobi-default", and "highs-hipo" columns (the latter
        two holding each solver's runtime in seconds, if solved).
    top_n : int, optional
        Number of problems to show per table.

    Notes
    -----
    Prints two tables (via `IPython.display.display`): the `top_n` largest
    (by "Num. variables") problems solved by HiPO, and separately by Gurobi,
    each showing both solvers' times and the Gurobi/HiPO speedup.
    """
    df = final_with_size.copy()

    # Keep only rows with valid size info
    df = df[
        df["Num. variables"].notna()
        & (df["Num. variables"] > 0)
        & df["Num. constraints"].notna()
        & (df["Num. constraints"] > 0)
    ]

    # Ensure numeric
    df["gurobi-default"] = pd.to_numeric(df["gurobi-default"], errors="coerce")
    df["highs-hipo"] = pd.to_numeric(df["highs-hipo"], errors="coerce")

    def _display_table(df_sub: pd.DataFrame, title: str) -> None:
        table = df_sub[
            [
                "Benchmark_clean",
                "Size",
                "Num. variables",
                "Num. constraints",
                "gurobi-default",
                "highs-hipo",
            ]
        ].copy()

        table = table.rename(columns={"Benchmark_clean": "Problem"})
        table["Gurobi time (min)"] = table["gurobi-default"] / 60
        table["HiPO time (min)"] = table["highs-hipo"] / 60
        table["Gurobi / HiPO speedup"] = table["gurobi-default"] / table["highs-hipo"]

        table = table.drop(columns=["gurobi-default", "highs-hipo"])

        print(f"\n{title}")
        display(
            table.sort_values("Num. variables", ascending=False)
            .style.hide(axis="index")
            .format(
                {
                    "Num. variables": "{:,.0f}",
                    "Num. constraints": "{:,.0f}",
                    "Gurobi time (min)": "{:.1f}",
                    "HiPO time (min)": "{:.1f}",
                    "Gurobi / HiPO speedup": "{:.1f}",
                },
                na_rep="N/A",
            )
        )

    # Table 1 — Largest problems solved by HiPO
    hipo_solved = df[df["highs-hipo"].notna() & (df["highs-hipo"] > 0)]
    hipo_largest = hipo_solved.sort_values("Num. variables", ascending=False).head(
        top_n
    )

    _display_table(
        hipo_largest,
        f"Largest {top_n} problems solved by HiPO",
    )

    # Table 2 — Largest problems solved by Gurobi
    gurobi_solved = df[df["gurobi-default"].notna() & (df["gurobi-default"] > 0)]
    gurobi_largest = gurobi_solved.sort_values("Num. variables", ascending=False).head(
        top_n
    )

    _display_table(
        gurobi_largest,
        f"Largest {top_n} problems solved by Gurobi",
    )

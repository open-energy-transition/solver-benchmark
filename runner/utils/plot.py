"""Charts and formatted tables for comparing solver performance.

The "Problem" column used throughout is a unique per-problem identifier
(post-#481, one metadata.yaml entry per model+size combination); see
`analyze.load_results` for how it's normalized from historical CSVs, where
the equivalent column ("Benchmark") named a model family shared across
multiple sizes rather than one specific problem.
"""

import re

import matplotlib as mpl
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from humanize import naturaldelta
from IPython.display import display
from matplotlib.patches import Patch

# Color map
color_map = {
    "cbc-default": "#F9CD5A",  # yellow
    "glpk-default": "#7C3AED",  # purple
    "gurobi-default": "#F66C49",  # red
    "highs-default": "#43BF94",  # green
    "highs-hipo": "#F759B8",  # magenta
    "highs-ipm": "#6D712E",  # green-brown
    "scip-default": "#3B82F6",  # blue
}


def display_speedups(
    results: pd.DataFrame, new_pypsa_benchs: pd.DataFrame
) -> "pd.io.formats.style.Styler":
    """Build a formatted table comparing HiGHS simplex/IPX/HiPO runtimes.

    Parameters
    ----------
    results : pd.DataFrame
        Result rows with "Problem", "Solver", "Runtime (s)", and "Status"
        columns (see `analyze.load_results`).
    new_pypsa_benchs : pd.DataFrame
        Problem metadata indexed by "Problem", with a "Num. variables"
        column.

    Returns
    -------
    pandas.io.formats.style.Styler
        A styled table with columns: Problem, Num. variables, Simplex/IPX/
        HiPO time, and IPX-vs-simplex / HiPO-vs-simplex speedups.

    Raises
    ------
    ValueError
        If any "Problem" in `results` is missing from `new_pypsa_benchs`.
    """
    speedup_df = results.pivot_table(
        index="Problem", columns="Solver", values="Runtime (s)", aggfunc="first"
    ).reset_index()

    # Also pivot Status column
    status_df = results.pivot_table(
        index="Problem", columns="Solver", values="Status", aggfunc="first"
    ).reset_index()

    # Calculate speedups relative to ipm-time, but use status if not "ok"
    speedup_df["ipm-speedup"] = speedup_df.apply(
        lambda row: (
            status_df.loc[status_df["Problem"] == row["Problem"], "highs-ipm"].values[0]
            if status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-ipm"
            ].values[0]
            != "ok"
            else row["highs-default"] / row["highs-ipm"]
        ),
        axis=1,
    )

    speedup_df["hipo-speedup"] = speedup_df.apply(
        lambda row: (
            status_df.loc[status_df["Problem"] == row["Problem"], "highs-hipo"].values[
                0
            ]
            if status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-hipo"
            ].values[0]
            != "ok"
            else row["highs-default"] / row["highs-hipo"]
        ),
        axis=1,
    )

    # Rename columns for clarity
    speedup_df = speedup_df.rename(
        columns={
            "highs-default": "simplex-time",
            "highs-ipm": "ipm-time",
            "highs-hipo": "hipo-time",
        }
    )

    # Add num-vars column by looking up in new_pypsa_benchs
    speedup_df = speedup_df.merge(
        new_pypsa_benchs[["Num. variables"]],
        left_on="Problem",
        right_index=True,
        how="left",
    )

    speedup_df = speedup_df.rename(columns={"Num. variables": "num-vars"})

    missing = speedup_df[speedup_df["num-vars"].isna()]["Problem"]
    if not missing.empty:
        raise ValueError("Missing Num. variables for:\n" + "\n".join(missing.tolist()))

    # Format the dataframe for pretty printing
    speedup_df = speedup_df.sort_values("num-vars")
    display_df = pd.DataFrame(speedup_df["Problem"])
    display_df["num-vars"] = speedup_df["num-vars"]

    display_df["simplex-time"] = speedup_df.apply(
        lambda row: (
            status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-default"
            ].values[0]
            if status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-default"
            ].values[0]
            != "ok"
            else naturaldelta(row["simplex-time"])
        ),
        axis=1,
    )

    display_df["ipm-time"] = speedup_df.apply(
        lambda row: (
            status_df.loc[status_df["Problem"] == row["Problem"], "highs-ipm"].values[0]
            if status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-ipm"
            ].values[0]
            != "ok"
            else naturaldelta(row["ipm-time"])
        ),
        axis=1,
    )

    display_df["hipo-time"] = speedup_df.apply(
        lambda row: (
            status_df.loc[status_df["Problem"] == row["Problem"], "highs-hipo"].values[
                0
            ]
            if status_df.loc[
                status_df["Problem"] == row["Problem"], "highs-hipo"
            ].values[0]
            != "ok"
            else naturaldelta(row["hipo-time"])
        ),
        axis=1,
    )

    display_df["ipm-speedup"] = speedup_df["ipm-speedup"].apply(
        lambda x: f"{x:.1f}x" if isinstance(x, (int, float)) else x
    )
    display_df["hipo-speedup"] = speedup_df["hipo-speedup"].apply(
        lambda x: f"{x:.1f}x" if isinstance(x, (int, float)) else x
    )

    display_df = display_df.reset_index(drop=True)

    display_df = display_df.rename(
        columns={
            "num-vars": "Num. variables",
            "simplex-time": "Simplex time",
            "ipm-time": "IPX time",
            "hipo-time": "HiPO time",
            "ipm-speedup": "IPX vs Simplex speedup",
            "hipo-speedup": "HiPO vs Simplex speedup",
        }
    )

    return display_df.style.hide(axis="index").format(
        {
            "Num. variables": "{:,.0f}".format,
        }
    )


def plot_runtime_slowdowns(
    df: pd.DataFrame,
    cls: str = "",
    figsize: tuple[float, float] = (12, 6),
    max_num_solvers: int = 5,
) -> None:
    """Plot relative runtimes (slowdown factors) in a bar chart.

    Parameters
    ----------
    df : pd.DataFrame
        Must have "Problem", "Solver", "Runtime (s)", "Status", and
        "Timeout" columns.
    cls : str, optional
        Problem class label appended to the chart title.
    figsize : tuple[float, float], optional
        Matplotlib figure size.
    max_num_solvers : int, optional
        Used to compute bar width, assuming at most this many solvers per
        problem.
    """
    # --- Solver display names (presentation only) ---
    solver_label_map = {
        "highs-default": "highs-simplex",
        "highs-ipm": "highs-ipm",
        "highs-hipo": "highs-hipo",
        "gurobi-default": "gurobi-default",
        "cbc-default": "cbc-default",
        "scip-default": "scip-default",
        "glpk-default": "glpk-default",
    }

    # Fill NaN runtimes and non-ok statuses with TO value
    df.loc[df["Runtime (s)"].isna(), "Runtime (s)"] = df["Timeout"]
    df.loc[df.query('Status != "ok"').index, "Runtime (s)"] = df["Timeout"]

    # Find the fastest solver for each problem
    df_ok = df.query('Status == "ok"')
    fastest_runtimes = df_ok.loc[df_ok.groupby("Problem")["Runtime (s)"].idxmin()]

    # Sort problems by fastest runtime
    sorted_problems = fastest_runtimes.sort_values("Runtime (s)").reset_index(drop=True)

    # Normalize runtimes to find each solver's slowdown factor
    df = df.merge(
        fastest_runtimes[["Problem", "Runtime (s)"]],
        on="Problem",
        suffixes=("", "_fastest"),
    )
    df["Slowdown"] = df["Runtime (s)"] / df["Runtime (s)_fastest"]
    max_slowdown = max(df.query('Status == "ok"')["Slowdown"])
    df.loc[df.query('Status != "ok"').index, "Slowdown"] = 1.1 * max_slowdown

    width = 1 / (max_num_solvers + 1)

    fig, ax = plt.subplots(figsize=figsize, layout="constrained")
    seen_solvers = set()

    # Add a dotted line at y=1
    ax.axhline(1, color="grey", linestyle="--")

    # Plot each problem
    for i, problem in enumerate(sorted_problems["Problem"]):
        problem_data = df[df["Problem"] == problem].sort_values(
            "Slowdown", ascending=True
        )
        num_solvers = len(problem_data)

        xs = i + (np.arange(num_solvers) * width) - 0.5 + width

        # Track solvers actually used
        seen_solvers.update(problem_data["Solver"])

        colors = [
            (
                *mcolors.to_rgba(color_map[r["Solver"]])[:3],
                1.0 if r["Status"] == "ok" else 0.2,
            )
            for _, r in problem_data.iterrows()
        ]

        ax.bar(xs, problem_data["Slowdown"], width, color=colors)

        # Labels on bars
        for j, x in enumerate(xs):
            y = problem_data.iloc[j]["Slowdown"] + 0.5
            if problem_data.iloc[j]["Status"] == "ok":
                label = f"{problem_data.iloc[j]['Slowdown']:.1f}x"
                kwargs = {}
            else:
                label = problem_data.iloc[j]["Status"]
                kwargs = {"color": "red", "weight": "bold"}

            ax.text(x, y, label, ha="center", **kwargs)

            if "Solved Problems" in df.columns:
                solved = problem_data.iloc[j]["Solved Problems"].split()[0]
                ax.text(x, y + max_slowdown * 0.03, solved, ha="center", color="grey")

    # X ticks
    xlabels = [
        f"{r['Problem']}\nFastest solver: {naturaldelta(r['Runtime (s)'])}"
        for _, r in sorted_problems.iterrows()
    ]
    ax.set_xticks(np.arange(len(sorted_problems)), xlabels)

    # Labels and title
    ax.set_ylabel("Relative Runtime (normalized)")
    ax.set_title(
        "Solver Runtime Comparison" + (f" – {cls}" if cls else ""),
        fontsize=24,
        fontweight="bold",
    )

    # Legend with renamed solvers
    ax.legend(
        handles=[
            Patch(color=color_map[s], label=solver_label_map.get(s, s))
            for s in seen_solvers
        ],
        title="Solver",
        loc="upper left",
    )


def plot_summary_results(
    summary_df: pd.DataFrame,
    cls: str,
    label_map: dict[str, str] | None = None,
    max_num_solvers: int = 5,
) -> None:
    """Plot `analyze.compute_summary_results`'s output as a runtime-slowdown chart.

    Parameters
    ----------
    summary_df : pd.DataFrame
        Output of `analyze.compute_summary_results`.
    cls : str
        Problem class to filter `summary_df` to and show in the chart title.
    label_map : dict[str, str], optional
        Maps "Category" values to display labels.
    max_num_solvers : int, optional
        Passed through to `plot_runtime_slowdowns`.
    """
    mpl.rcParams.update(
        {
            "font.size": 22,
            "axes.titlesize": 22,
            "axes.labelsize": 22,
            "xtick.labelsize": 22,
            "ytick.labelsize": 22,
            "legend.fontsize": 22,
            "legend.title_fontsize": 22,
            "figure.constrained_layout.use": True,
        }
    )

    lp_summary = summary_df.query(f'Class == "{cls}"').copy()

    if label_map:
        lp_summary["Category"] = lp_summary["Category"].map(label_map)

    lp_summary = lp_summary.rename(
        columns={"Category": "Problem", "SGM Runtime": "Runtime (s)"}
    )

    lp_summary["Status"] = "ok"
    lp_summary["Solver"] = lp_summary["Solver"].apply(
        lambda s: (
            re.match(r"^([a-z\-]+?)(?:-\d)", s).group(1)
            if re.match(r"^([a-z\-]+?)(?:-\d)", s)
            else s
        )
    )
    lp_summary["Timeout"] = None

    plot_runtime_slowdowns(
        lp_summary, cls=cls, figsize=(35, 12), max_num_solvers=max_num_solvers
    )

    ax = plt.gca()
    ax.set_ylim(0, ax.get_ylim()[1] * 1.10)


def print_sgm_tables_per_bucket(
    final_with_size: pd.DataFrame,
    buckets: list[dict],
    solvers: tuple[str, ...] = (
        "highs-default",
        "highs-hipo",
        "highs-ipm",
        "gurobi-default",
    ),
    shift: float = 1.0,
) -> None:
    """Print one SGM runtime table per bucket, including solved percentage.

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have a "Num. variables" column and one column per entry in
        `solvers` (that solver's runtime in seconds, if solved).
    buckets : list[dict]
        Each `{"name": str, "mask": pd.Series[bool], "penalty": float}`: a
        named subset of `final_with_size` (`mask`), and the runtime penalty
        (e.g. a timeout value) substituted in for unsolved problems in the
        SGM computation.
    solvers : tuple[str, ...], optional
        Columns to summarize, in table order.
    shift : float, optional
        Shift applied by the shifted geometric mean (see
        `analyze.calculate_sgm`).

    Notes
    -----
    Prints one table per bucket (via `IPython.display.display`) with
    columns: Solver, SGM runtime (min), # solved, # total, % solved.
    """
    # Presentation-ready solver labels
    solver_label_map = {
        "highs-default": "HiGHS-Simplex",
        "highs-ipm": "HiGHS-IPX",
        "highs-hipo": "HiGHS-HiPO",
        "gurobi-default": "Gurobi",
    }

    def shifted_geometric_mean(x: np.ndarray, shift: float = 1.0) -> float:
        x = np.asarray(x)
        return np.exp(np.mean(np.log(x + shift))) - shift

    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for b in buckets:
        rows = []
        dfb = df[b["mask"]]
        n_total = len(dfb)

        if n_total == 0:
            continue

        for solver in solvers:
            solved = dfb[solver].dropna().values
            n_solved = len(solved)
            n_to = n_total - n_solved

            runtimes = np.concatenate(
                [
                    solved,
                    np.full(n_to, b["penalty"]),
                ]
            )

            sgm_sec = shifted_geometric_mean(runtimes, shift=shift)

            rows.append(
                {
                    "Solver": solver_label_map.get(solver, solver),
                    "SGM runtime (min)": round(sgm_sec / 60, 2),
                    "# solved": n_solved,
                    "# total": n_total,
                    "% solved": round(100 * n_solved / n_total, 1),
                }
            )

        table = pd.DataFrame(rows)

        print(f"\n{b['name']}")
        display(
            table.style.hide(axis="index").format(
                {
                    "SGM runtime (min)": "{:.2f}",
                    "% solved": "{:.1f}",
                }
            )
        )


def plot_speedup_vs_variables(
    final_with_size: pd.DataFrame,
    figsize: tuple[float, float] = (12, 4),
    outpath: str = "speedup_vs_num_variables.png",
    dpi: int = 300,
) -> None:
    """Scatter-plot HiPO's speedup vs. simplex/IPX/Gurobi against problem size.

    Three horizontal panels: HiPO vs. simplex, HiPO vs. IPX, HiPO vs. Gurobi,
    each plotting `runtime_reference / runtime_target` (speedup) against
    "Num. variables" on log-log axes. Saves the figure to `outpath`.

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have "Num. variables", "highs-default", "highs-hipo", "highs-ipm", and
        "gurobi-default" columns (the latter four holding runtimes in seconds, if
        solved).
    figsize : tuple[float, float], optional
        Matplotlib figure size.
    outpath : str, optional
        Where to save the figure.
    dpi : int, optional
        Resolution to save the figure at.
    """
    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for c in ["highs-default", "highs-hipo", "highs-ipm", "gurobi-default"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    fig, axes = plt.subplots(1, 3, figsize=figsize, sharey=True)

    # HiPO vs simplex
    ax = axes[0]
    m = (
        df["highs-default"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-default"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "highs-default"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs simplex", fontsize=14, fontweight="bold")

    # HiPO vs IPx
    ax = axes[1]
    m = (
        df["highs-ipm"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-ipm"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "highs-ipm"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs IPX", fontsize=14, fontweight="bold")

    # HiPO vs Gurobi
    ax = axes[2]
    m = (
        df["gurobi-default"].notna()
        & df["highs-hipo"].notna()
        & (df["gurobi-default"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "gurobi-default"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs Gurobi", fontsize=14, fontweight="bold")

    # Shared formatting
    for ax in axes:
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.grid(which="both", linestyle="--", linewidth=0.5)
        ax.tick_params(axis="both", which="major", labelsize=11)
        ax.tick_params(axis="both", which="minor", labelsize=9)

    axes[0].set_ylabel("Speedup (-)", fontsize=13)
    for ax in axes:
        ax.set_xlabel("Number of variables (-)", fontsize=12)

    plt.tight_layout()
    plt.savefig(outpath, dpi=dpi, bbox_inches="tight")
    plt.show()


def plot_solver_scaling_by_bucket(
    final_with_size: pd.DataFrame,
    solvers: tuple[str, ...] = (
        "gurobi-default",
        "highs-default",
        "highs-hipo",
        "highs-ipm",
    ),
    figsize: tuple[float, float] = (10, 15),
) -> None:
    """Scatter-plot runtime vs. problem size, with a log-log fit, per size bucket.

    Three vertical panels (Small: < 1e4 variables, Medium: 1e4-1e6, Large:
    >= 1e6), each with one scatter series + power-law fit line per solver.

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have a "Num. variables" column and one column per entry in
        `solvers` (that solver's runtime in seconds, if solved).
    solvers : tuple[str, ...], optional
        Columns to plot.
    figsize : tuple[float, float], optional
        Matplotlib figure size.
    """
    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for s in solvers:
        df[s] = pd.to_numeric(df[s], errors="coerce")

    # Define buckets
    buckets = {
        "S problems": df["Num. variables"] < 1e4,
        "M problems": (df["Num. variables"] >= 1e4) & (df["Num. variables"] < 1e6),
        "L problems": df["Num. variables"] >= 1e6,
    }

    fig, axes = plt.subplots(3, 1, figsize=figsize, sharex=False, sharey=True)

    for ax, (bucket_name, mask_bucket) in zip(axes, buckets.items()):
        dfb = df[mask_bucket]

        for s in solvers:
            sdf = dfb[dfb[s].notna() & (dfb[s] > 0)]
            if sdf.empty:
                continue

            x = sdf["Num. variables"].to_numpy()
            y = sdf[s].to_numpy()

            # Scatter
            ax.scatter(x, y, label=s, alpha=0.8)

            # Log-log fit (within bucket)
            lx = np.log10(x)
            ly = np.log10(y)
            mask = np.isfinite(lx) & np.isfinite(ly)

            if mask.sum() < 2:
                continue

            a, b = np.polyfit(lx[mask], ly[mask], 1)

            lx_fit = np.linspace(lx[mask].min(), lx[mask].max(), 100)
            y_fit = 10 ** (a * lx_fit + b)

            ax.plot(10**lx_fit, y_fit)

        ax.set_xscale("log")
        ax.set_yscale("log")

        # Titles
        ax.set_title(bucket_name, fontsize=18, fontweight="bold")

        ax.set_xlabel("Number of variables (-)", fontsize=18)
        ax.set_ylabel("Runtime (s)", fontsize=18)

        # Larger tick labels
        ax.tick_params(axis="both", which="major", labelsize=14)
        ax.tick_params(axis="both", which="minor", labelsize=12)

        ax.grid(which="both", linestyle="--", linewidth=0.5)

    # Legend only once
    axes[-1].legend(fontsize=14, loc="best")

    plt.tight_layout()
    plt.show()


def plot_speedup_vs_constraints(
    final_with_size: pd.DataFrame,
    figsize: tuple[float, float] = (12, 4),
    outpath: str = "speedup_vs_num_constraints.png",
    dpi: int = 300,
) -> None:
    """Scatter-plot HiPO's speedup vs. simplex/IPX/Gurobi against constraint count.

    Same as `plot_speedup_vs_variables`, but against "Num. constraints"
    instead of "Num. variables".

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have "Num. constraints", "highs-default", "highs-hipo", "highs-ipm",
        and "gurobi-default" columns (the latter four holding runtimes in seconds,
        if solved).
    figsize : tuple[float, float], optional
        Matplotlib figure size.
    outpath : str, optional
        Where to save the figure.
    dpi : int, optional
        Resolution to save the figure at.
    """
    df = final_with_size.copy()
    df = df[df["Num. constraints"].notna() & (df["Num. constraints"] > 0)]

    for c in ["highs-default", "highs-hipo", "highs-ipm", "gurobi-default"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    fig, axes = plt.subplots(1, 3, figsize=figsize, sharey=True)

    # HiPO vs simplex
    ax = axes[0]
    m = (
        df["highs-default"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-default"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "highs-default"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs simplex", fontsize=14, fontweight="bold")

    # HiPO vs IPM
    ax = axes[1]
    m = (
        df["highs-ipm"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-ipm"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "highs-ipm"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs IPX", fontsize=14, fontweight="bold")

    # HiPO vs Gurobi
    ax = axes[2]
    m = (
        df["gurobi-default"].notna()
        & df["highs-hipo"].notna()
        & (df["gurobi-default"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "gurobi-default"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs Gurobi", fontsize=14, fontweight="bold")

    # Shared formatting
    for ax in axes:
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.grid(which="both", linestyle="--", linewidth=0.5)
        ax.tick_params(axis="both", which="major", labelsize=11)
        ax.tick_params(axis="both", which="minor", labelsize=9)

    axes[0].set_ylabel("Speedup (-)", fontsize=13)
    for ax in axes:
        ax.set_xlabel("Number of constraints (-)", fontsize=12)

    plt.tight_layout()
    plt.savefig(outpath, dpi=dpi, bbox_inches="tight")
    plt.show()


def plot_solver_scaling_by_bucket_scatter_only(
    final_with_size: pd.DataFrame,
    solvers: tuple[str, ...] = (
        "gurobi-default",
        "highs-default",
        "highs-hipo",
        "highs-ipm",
    ),
    figsize: tuple[float, float] = (10, 15),
) -> None:
    """Scatter-plot runtime vs. problem size with log-log trend lines, per bucket.

    Same idea as `plot_solver_scaling_by_bucket`, but the trend line is a
    dashed power-law fit drawn over the scatter's own x-range rather than a
    separately-plotted fitted curve.

    Three vertical panels (Small: < 1e4 variables, Medium: 1e4-1e6, Large:
    >= 1e6).

    Parameters
    ----------
    final_with_size : pd.DataFrame
        Must have a "Num. variables" column and one column per entry in
        `solvers` (that solver's runtime in seconds, if solved).
    solvers : tuple[str, ...], optional
        Columns to plot.
    figsize : tuple[float, float], optional
        Matplotlib figure size.
    """
    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for s in solvers:
        df[s] = pd.to_numeric(df[s], errors="coerce")

    # Define buckets
    buckets = {
        "Small (<1e4)": df["Num. variables"] < 1e4,
        "Medium (1e4–1e6)": (df["Num. variables"] >= 1e4)
        & (df["Num. variables"] < 1e6),
        "Large (≥1e6)": df["Num. variables"] >= 1e6,
    }

    fig, axes = plt.subplots(3, 1, figsize=figsize, sharey=True)

    for ax, (bucket_name, mask_bucket) in zip(axes, buckets.items()):
        dfb = df[mask_bucket]

        for s in solvers:
            sdf = dfb[dfb[s].notna() & (dfb[s] > 0)]
            if sdf.empty:
                continue

            x = sdf["Num. variables"].values
            y = sdf[s].values

            # Scatter
            ax.scatter(x, y, label=s, alpha=0.8)

            # -------- Trend line (log-log fit) --------
            if len(x) >= 2:
                logx = np.log10(x)
                logy = np.log10(y)

                coeffs = np.polyfit(logx, logy, 1)
                slope, intercept = coeffs

                x_fit = np.logspace(logx.min(), logx.max(), 100)
                y_fit = 10 ** (intercept) * x_fit**slope

                ax.plot(
                    x_fit,
                    y_fit,
                    linestyle="--",
                    linewidth=2,
                    alpha=0.8,
                )

        ax.set_xscale("log")
        ax.set_yscale("log")

        ax.set_title(bucket_name, fontsize=18, fontweight="bold")
        ax.set_xlabel("Number of variables (-)", fontsize=18)
        ax.set_ylabel("Runtime (s)", fontsize=18)

        ax.tick_params(axis="both", which="major", labelsize=14)
        ax.tick_params(axis="both", which="minor", labelsize=12)

        ax.grid(which="both", linestyle="--", linewidth=0.5)

    axes[-1].legend(fontsize=14, loc="best")

    plt.tight_layout()
    plt.show()

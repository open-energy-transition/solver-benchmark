#!/usr/bin/env python3

from __future__ import annotations

import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

V2_RESULTS = Path("results/benchmark_results.csv")
V3_RESULTS = Path("results/benchmark_results_v3_linopy_current.csv")
OUTPUT = Path("notebooks/figures/v3-linopy-current")

SOLVER_NAME_MAP = {
    "gurobi-default": "gurobi",
    "scip-default": "scip",
    "cbc-default": "cbc",
    "glpk-default": "glpk",
    "highs-ipm": "highs-ipm",
    "highs-hipo": "highs-hipo",
}

FRAMEWORK_ORDER = [
    "ETHOS.FINE",
    "FINE",
    "GenX",
    "IESA-Opt",
    "oemof",
    "openTEPES",
    "PyPSA-DE",
    "PyPSA-Eur",
    "Resource Adequacy / DCOPF",
    "SWITCH",
    "TEMOA",
    "TIMES",
    "Zen-Garden",
    "Other",
]


def framework(problem: str) -> str:
    p = problem.lower()

    if p.startswith("ethos-fine-"):
        return "ETHOS.FINE"
    if p.startswith("fine-"):
        return "FINE"
    if p.startswith("genx-"):
        return "GenX"
    if p.startswith("iesa-"):
        return "IESA-Opt"
    if p.startswith("oemof-"):
        return "oemof"
    if p.startswith("opentepes-"):
        return "openTEPES"
    if p.startswith("pypsa-de-"):
        return "PyPSA-DE"
    if p.startswith("pypsa-eur-"):
        return "PyPSA-Eur"
    if p.startswith("dcopf-"):
        return "Resource Adequacy / DCOPF"
    if p.startswith("switch-"):
        return "SWITCH"
    if p.startswith("temoa-"):
        return "TEMOA"
    if p.startswith("times-"):
        return "TIMES"
    if p.startswith("zen-garden-"):
        return "Zen-Garden"

    return "Other"


def version_key(value: str):
    parts = re.split(r"(\d+)", str(value))
    return tuple(int(x) if x.isdigit() else x for x in parts)


def load_results():
    v2 = pd.read_csv(V2_RESULTS)
    v3 = pd.read_csv(V3_RESULTS)

    # Exclude calibration/reference benchmark rows.
    v3 = v3[
        (v3["Problem"] != "reference-benchmark") & (v3["Solver"] != "highs-binary")
    ].copy()

    v3["Solver match"] = v3["Solver"].replace(SOLVER_NAME_MAP).astype(str)
    v3["Problem match"] = v3["Problem"].astype(str)
    v3["Solver Version match"] = v3["Solver Version"].astype(str)
    v3["VM match"] = v3["VM Instance Type"].astype(str)
    v3["Timestamp parsed"] = pd.to_datetime(v3["Timestamp"], errors="coerce")

    if "Problem" in v2.columns:
        v2["Problem match"] = v2["Problem"].astype(str)
    else:
        v2["Problem match"] = v2["Benchmark"].astype(str) + "-" + v2["Size"].astype(str)

    v2["Solver match"] = v2["Solver"].astype(str)
    v2["Solver Version match"] = v2["Solver Version"].astype(str)
    v2["VM match"] = v2["VM Instance Type"].astype(str)
    v2["Timestamp parsed"] = pd.to_datetime(v2["Timestamp"], errors="coerce")

    keys = [
        "Problem match",
        "Solver match",
        "Solver Version match",
        "VM match",
    ]

    # Published V2 may contain repeated exact keys.
    # Use the most recently published row.
    v2 = v2.sort_values("Timestamp parsed").drop_duplicates(keys, keep="last")

    v3 = v3.sort_values("Timestamp parsed").drop_duplicates(keys, keep="last")

    return v2, v3


def get_v2_row(v2, solver, version, problem, vm):
    rows = v2[
        (v2["Solver match"] == solver)
        & (v2["Solver Version match"] == version)
        & (v2["Problem match"] == problem)
        & (v2["VM match"] == vm)
    ]

    if rows.empty:
        return None

    return rows.iloc[0]


def make_problem_order(v3):
    problems = v3["Problem match"].unique()

    return sorted(
        problems,
        key=lambda p: (
            FRAMEWORK_ORDER.index(framework(p)),
            p,
        ),
    )


def plot_metric_v2_v3(
    v2,
    v3,
    problem_order,
    solver,
    solver_title,
    column,
    ylabel,
    filename,
    *,
    log=False,
    points=False,
):
    sv3 = v3[v3["Solver match"] == solver].copy()

    if sv3.empty:
        return

    versions = sorted(
        sv3["Solver Version match"].unique(),
        key=version_key,
    )

    fig, axes = plt.subplots(
        len(versions),
        1,
        figsize=(18, max(6, 6.7 * len(versions))),
        squeeze=False,
    )

    axes = axes[:, 0]

    for ax, version in zip(axes, versions):
        current = sv3[sv3["Solver Version match"] == version].copy()

        run_set = set(current["Problem match"])

        # Same global order in every plot, grouped by framework,
        # without displaying framework names.
        problems = [p for p in problem_order if p in run_set]

        current = current.set_index("Problem match").reindex(problems)

        v2_values = []
        v3_values = []
        notes = []

        for problem, row in current.iterrows():
            baseline = get_v2_row(
                v2,
                solver,
                version,
                problem,
                str(row["VM match"]),
            )

            v3_value = pd.to_numeric(
                pd.Series([row[column]]),
                errors="coerce",
            ).iloc[0]

            v3_values.append(v3_value)

            if baseline is None:
                v2_values.append(np.nan)

                note = "V3 only"

                if pd.isna(v3_value):
                    note += f" · V3 {str(row['Status']).upper()}"

                notes.append(note)
                continue

            v2_value = pd.to_numeric(
                pd.Series([baseline[column]]),
                errors="coerce",
            ).iloc[0]

            v2_values.append(v2_value)

            missing = []

            if pd.isna(v2_value):
                missing.append(f"V2 {str(baseline['Status']).upper()}")

            if pd.isna(v3_value):
                missing.append(f"V3 {str(row['Status']).upper()}")

            notes.append(" · ".join(missing))

        y = np.arange(len(problems), dtype=float)

        if points:
            ax.scatter(
                v2_values,
                y - 0.12,
                label="V2",
                marker="o",
                s=40,
            )

            ax.scatter(
                v3_values,
                y + 0.12,
                label="V3",
                marker="s",
                s=40,
            )
        else:
            height = 0.34

            ax.barh(
                y - height / 2,
                v2_values,
                height=height,
                label="V2",
            )

            ax.barh(
                y + height / 2,
                v3_values,
                height=height,
                label="V3",
            )

        finite = (
            pd.Series(v2_values + v3_values).replace([np.inf, -np.inf], np.nan).dropna()
        )

        if log and len(finite) and (finite > 0).all():
            ax.set_xscale("log")

        ax.set_yticks(y)
        ax.set_yticklabels(problems, fontsize=8)
        ax.invert_yaxis()

        ax.set_title(
            f"{solver_title} {version}",
            fontsize=13,
        )

        ax.set_xlabel(ylabel)
        ax.set_ylabel("")
        ax.grid(axis="x", alpha=0.25)
        ax.legend(loc="lower right")

        # Only annotate information that cannot be shown as a bar/point.
        for yi, note in enumerate(notes):
            if note:
                ax.text(
                    0.012,
                    yi,
                    note,
                    transform=ax.get_yaxis_transform(),
                    ha="left",
                    va="center",
                    fontsize=7.5,
                    fontstyle="italic",
                )

    fig.suptitle(
        f"{solver_title} — {ylabel}",
        fontsize=16,
        y=1.002,
    )

    fig.tight_layout()

    fig.savefig(
        OUTPUT / filename,
        dpi=180,
        bbox_inches="tight",
    )

    plt.close(fig)


def plot_status_v2_v3(
    v2,
    v3,
    problem_order,
    solver,
    solver_title,
    filename,
):
    sv3 = v3[v3["Solver match"] == solver].copy()

    if sv3.empty:
        return

    versions = sorted(
        sv3["Solver Version match"].unique(),
        key=version_key,
    )

    fig, axes = plt.subplots(
        len(versions),
        1,
        figsize=(18, max(6, 6.7 * len(versions))),
        squeeze=False,
    )

    axes = axes[:, 0]

    status_positions = {
        "OK": 0,
        "TO": 1,
        "ER": 2,
        "OOM": 3,
        "WARNING": 4,
    }

    for ax, version in zip(axes, versions):
        current = sv3[sv3["Solver Version match"] == version].copy()

        run_set = set(current["Problem match"])

        problems = [p for p in problem_order if p in run_set]

        current = current.set_index("Problem match").reindex(problems)

        y = np.arange(len(problems), dtype=float)

        for yi, (problem, row) in enumerate(current.iterrows()):
            v3_status = str(row["Status"]).upper()

            baseline = get_v2_row(
                v2,
                solver,
                version,
                problem,
                str(row["VM match"]),
            )

            if baseline is not None:
                v2_status = str(baseline["Status"]).upper()

                ax.scatter(
                    status_positions.get(v2_status, 5),
                    yi - 0.12,
                    marker="o",
                    s=40,
                )
            else:
                ax.text(
                    0.012,
                    yi,
                    "V3 only",
                    transform=ax.get_yaxis_transform(),
                    ha="left",
                    va="center",
                    fontsize=7.5,
                    fontstyle="italic",
                )

            ax.scatter(
                status_positions.get(v3_status, 5),
                yi + 0.12,
                marker="s",
                s=40,
            )

        ax.set_yticks(y)
        ax.set_yticklabels(problems, fontsize=8)
        ax.invert_yaxis()

        ax.set_xticks(list(status_positions.values()))
        ax.set_xticklabels(list(status_positions.keys()))

        ax.set_xlim(-0.5, 4.5)

        ax.set_title(
            f"{solver_title} {version}",
            fontsize=13,
        )

        ax.set_xlabel("Status")
        ax.set_ylabel("")
        ax.grid(axis="x", alpha=0.25)

        ax.scatter(
            [],
            [],
            marker="o",
            s=40,
            label="V2",
        )

        ax.scatter(
            [],
            [],
            marker="s",
            s=40,
            label="V3",
        )

        ax.legend(loc="lower right")

    fig.suptitle(
        f"{solver_title} — Status",
        fontsize=16,
        y=1.002,
    )

    fig.tight_layout()

    fig.savefig(
        OUTPUT / filename,
        dpi=180,
        bbox_inches="tight",
    )

    plt.close(fig)


def plot_highs_metric(
    v3,
    problem_order,
    column,
    ylabel,
    filename,
    *,
    log=False,
    points=False,
):
    highs = v3[v3["Solver match"].isin(["highs-ipm", "highs-hipo"])].copy()

    highs["Series"] = (
        highs["Solver match"].replace(
            {
                "highs-ipm": "IPM",
                "highs-hipo": "HiPO",
            }
        )
        + " "
        + highs["Solver Version match"]
    )

    problems = [p for p in problem_order if p in set(highs["Problem match"])]

    series = sorted(highs["Series"].unique())

    fig, ax = plt.subplots(figsize=(18, max(7, 0.45 * len(problems) + 3)))

    y = np.arange(len(problems), dtype=float)
    offsets = np.linspace(-0.16, 0.16, len(series))

    for offset, series_name in zip(
        offsets,
        series,
    ):
        sub = (
            highs[highs["Series"] == series_name]
            .set_index("Problem match")
            .reindex(problems)
        )

        values = pd.to_numeric(
            sub[column],
            errors="coerce",
        )

        if points:
            ax.scatter(
                values,
                y + offset,
                label=series_name,
                s=42,
            )
        else:
            ax.barh(
                y + offset,
                values,
                height=0.28,
                label=series_name,
            )

        for yi, (_, row) in enumerate(sub.iterrows()):
            if pd.isna(values.iloc[yi]) and pd.notna(row.get("Status")):
                ax.text(
                    0.012,
                    yi + offset,
                    str(row["Status"]).upper(),
                    transform=ax.get_yaxis_transform(),
                    ha="left",
                    va="center",
                    fontsize=7.2,
                    fontstyle="italic",
                )

    finite = pd.to_numeric(
        highs[column],
        errors="coerce",
    ).dropna()

    if log and len(finite) and (finite > 0).all():
        ax.set_xscale("log")

    ax.set_yticks(y)
    ax.set_yticklabels(problems, fontsize=8)
    ax.invert_yaxis()

    ax.set_xlabel(ylabel)
    ax.set_ylabel("")
    ax.set_title(f"HiGHS V3 — {ylabel}")
    ax.grid(axis="x", alpha=0.25)
    ax.legend(loc="lower right")

    fig.tight_layout()

    fig.savefig(
        OUTPUT / filename,
        dpi=180,
        bbox_inches="tight",
    )

    plt.close(fig)


def plot_highs_status(v3, problem_order):
    highs = v3[v3["Solver match"].isin(["highs-ipm", "highs-hipo"])].copy()

    problems = [p for p in problem_order if p in set(highs["Problem match"])]

    status_positions = {
        "OK": 0,
        "TO": 1,
        "ER": 2,
        "OOM": 3,
        "WARNING": 4,
    }

    fig, ax = plt.subplots(figsize=(18, max(7, 0.45 * len(problems) + 3)))

    y = np.arange(len(problems), dtype=float)

    for offset, solver, label in [
        (-0.12, "highs-ipm", "IPM 1.15.1"),
        (0.12, "highs-hipo", "HiPO 1.15.1"),
    ]:
        sub = (
            highs[highs["Solver match"] == solver]
            .set_index("Problem match")
            .reindex(problems)
        )

        xs = [
            status_positions.get(
                str(status).upper(),
                5,
            )
            for status in sub["Status"]
        ]

        ax.scatter(
            xs,
            y + offset,
            s=42,
            label=label,
        )

    ax.set_yticks(y)
    ax.set_yticklabels(problems, fontsize=8)
    ax.invert_yaxis()

    ax.set_xticks(list(status_positions.values()))
    ax.set_xticklabels(list(status_positions.keys()))

    ax.set_xlim(-0.5, 4.5)

    ax.set_title("HiGHS V3 — Status")
    ax.grid(axis="x", alpha=0.25)
    ax.legend(loc="lower right")

    fig.tight_layout()

    fig.savefig(
        OUTPUT / "highs_v3_status.png",
        dpi=180,
        bbox_inches="tight",
    )

    plt.close(fig)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)

    v2, v3 = load_results()
    problem_order = make_problem_order(v3)

    solvers = [
        ("gurobi", "Gurobi"),
        ("scip", "SCIP"),
        ("cbc", "CBC"),
        ("glpk", "GLPK"),
    ]

    metrics = [
        (
            "Runtime (s)",
            "Runtime (s)",
            "runtime",
            True,
            False,
        ),
        (
            "Memory Usage (MB)",
            "Memory usage (MB)",
            "memory",
            True,
            False,
        ),
        (
            "Objective Value",
            "Objective value",
            "objective",
            True,
            False,
        ),
        (
            "Max Integrality Violation",
            "Max integrality violation",
            "max_integrality_violation",
            False,
            True,
        ),
        (
            "Duality Gap",
            "Duality gap",
            "duality_gap",
            False,
            True,
        ),
    ]

    for solver, title in solvers:
        plot_status_v2_v3(
            v2,
            v3,
            problem_order,
            solver,
            title,
            f"{solver}_status.png",
        )

        for (
            column,
            ylabel,
            name,
            log,
            points,
        ) in metrics:
            plot_metric_v2_v3(
                v2,
                v3,
                problem_order,
                solver,
                title,
                column,
                ylabel,
                f"{solver}_{name}.png",
                log=log,
                points=points,
            )

    # No exact V2 HiGHS 1.15.1 baseline.
    plot_highs_status(v3, problem_order)

    for (
        column,
        ylabel,
        name,
        log,
        points,
    ) in metrics:
        plot_highs_metric(
            v3,
            problem_order,
            column,
            ylabel,
            f"highs_v3_{name}.png",
            log=log,
            points=points,
        )

    print(f"Generated {len(list(OUTPUT.glob('*.png')))} figures in {OUTPUT}")


if __name__ == "__main__":
    main()

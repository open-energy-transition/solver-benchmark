"""Tests for tests/check_objectives.py: the cross-solver objective check."""

import csv

import pytest

from tests.check_objectives import (
    check_results,
    cluster,
    load_problem_classes,
    main,
    read_ok_runs,
)

COLUMNS = [
    "Benchmark",
    "Size",
    "Solver",
    "Solver Version",
    "Solver Release Year",
    "Status",
    "Objective Value",
]


def run(solver, obj, problem="p-1-1h", version="1", year=2025.0):
    return {
        "problem": problem,
        "solver": solver,
        "version": version,
        "year": year,
        "obj": obj,
    }


def statuses(runs, cls="LP", **kwargs):
    rows, _ = check_results(runs, {"p-1-1h": cls}, **kwargs)
    return {(r["Solver"], r["Solver Version"]): r["Status"] for r in rows}


def test_agreement():
    got = statuses(
        [run("gurobi", 100.0), run("highs", 100.0 + 1e-8), run("scip", 100.0)]
    )
    assert set(got.values()) == {"agree"}


def test_one_outlier_among_many():
    got = statuses(
        [
            run("gurobi", 100.0),
            run("highs", 100.0),
            run("scip", 100.0),
            run("cbc", 150.0),
        ]
    )
    assert got[("cbc", "1")] == "outlier"
    assert {v for k, v in got.items() if k[0] != "cbc"} == {"agree"}


def test_two_solvers_that_disagree_are_both_flagged():
    got = statuses([run("gurobi", 100.0), run("highs", 200.0)])
    assert set(got.values()) == {"disagree_no_majority"}


def test_two_solvers_that_agree():
    assert set(statuses([run("gurobi", 100.0), run("highs", 100.0)]).values()) == {
        "agree"
    }


def test_single_solver_has_no_reference():
    rows, _ = check_results(
        [run("gurobi", 100.0), run("gurobi", 500.0, version="2")], {}
    )
    assert {r["Status"] for r in rows} == {"no_reference"}


def test_milp_tolerance_is_looser_than_lp():
    runs = [
        run("gurobi", 1000.0),
        run("highs", 1000.0),
        run("scip", 1000.0 * (1 + 1e-4)),
    ]
    assert statuses(runs, "LP")[("scip", "1")] == "outlier"
    assert statuses(runs, "MILP")[("scip", "1")] == "agree"


def test_unknown_class_uses_the_milp_tolerance():
    rows, _ = check_results(
        [run("gurobi", 1000.0), run("highs", 1000.0), run("scip", 1000.1)], {}
    )
    assert {r["Problem class"] for r in rows} == {"unknown"}
    assert {r["Status"] for r in rows} == {"agree"}


def test_small_objective_uses_an_absolute_tolerance():
    runs = [run("gurobi", 0.0), run("highs", 1e-9), run("scip", 0.0)]
    assert set(statuses(runs).values()) == {"agree"}


def test_constant_offset_of_genx_10():
    runs = [
        run("gurobi", 1149079.0505, version="13"),
        run("cbc", 1149079.0505, version="2.10.12"),
        run("highs", 1150959.0505, version="1.12.0"),
        run("highs-hipo", 1150959.0505, version="1.12.0-hipo"),
        run("highs-ipx", 1150959.0505, version="1.12.0-hipo"),
    ]
    got = statuses(runs)
    assert got[("gurobi", "13")] == got[("cbc", "2.10.12")] == "agree"
    assert {got[("highs", "1.12.0")], got[("highs-hipo", "1.12.0-hipo")]} == {"outlier"}


def test_power_of_ten_error_of_glpk():
    runs = [
        run("gurobi", 7.82077055),
        run("highs", 7.82077055),
        run("scip", 7.82077055),
        run("glpk", 17.82077055),
    ]
    assert statuses(runs)[("glpk", "1")] == "outlier"


def test_old_version_is_checked_but_does_not_vote():
    runs = [
        run("gurobi", 100.0, version="13", year=2025.0),
        run("gurobi", 120.0, version="10", year=2022.0),
        run("highs", 100.0),
        run("scip", 100.0),
    ]
    got = statuses(runs)
    assert got[("gurobi", "10")] == "outlier"
    assert got[("gurobi", "13")] == "agree"


def test_load_problem_classes(tmp_path):
    path = tmp_path / "metadata.yaml"
    path.write_text("problems:\n  a:\n    Problem class: LP\n  b:\n    Size: S\n")
    assert load_problem_classes(path) == {"a": "LP"}
    assert load_problem_classes(tmp_path / "missing.yaml") == {}


def write_results(path, rows):
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(COLUMNS)
        w.writerows(rows)


def test_read_ok_runs_skips_failed_and_missing_objectives(tmp_path):
    path = tmp_path / "r.csv"
    write_results(
        path,
        [
            ["b", "1-1h", "gurobi", "13", "2025.0", "ok", "5.0"],
            ["b", "1-1h", "highs", "1", "2025.0", "TO", ""],
            ["b", "1-1h", "scip", "1", "2025.0", "ok", ""],
        ],
    )
    runs = read_ok_runs(path)
    assert [(r["problem"], r["solver"], r["obj"]) for r in runs] == [
        ("b-1-1h", "gurobi", 5.0)
    ]


def test_main_writes_output_and_exit_code(tmp_path, capsys):
    path = tmp_path / "r.csv"
    write_results(
        path,
        [
            ["b", "1-1h", "gurobi", "13", "2025.0", "ok", "5.0"],
            ["b", "1-1h", "highs", "1", "2025.0", "ok", "9.0"],
        ],
    )
    out = tmp_path / "flags.csv"
    args = [str(path), "--metadata", str(tmp_path / "none.yaml"), "--output", str(out)]
    assert main(args) == 0
    assert main([*args, "--fail-on-flag"]) == 1
    assert "disagree_no_majority" in capsys.readouterr().out
    assert len(out.read_text().splitlines()) == 3


@pytest.mark.parametrize("tol", [1e-3, 1e-2])
def test_custom_tolerance(tol):
    runs = [run("gurobi", 100.0), run("highs", 100.0), run("scip", 100.5)]
    expected = "agree" if tol == 1e-2 else "outlier"
    assert statuses(runs, "LP", lp_tol=tol)[("scip", "1")] == expected


def test_clusters_do_not_chain():
    # each step is within tol of the previous value, but the ends are not
    clusters = cluster({"a": 0.0, "b": 0.6e-5, "c": 1.2e-5}, 1e-5)
    assert clusters == [["a", "b"], ["c"]]

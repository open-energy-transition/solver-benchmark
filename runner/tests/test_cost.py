"""Tests for runner/utils/cost.py: estimating the VM-hours and cost of a
benchmark campaign from its VM YAMLs and past results.
"""

import pandas as pd
import pytest

from runner.utils.cost import estimate_campaign_cost, format_estimate

_VM_COSTS = {
    "region": "us-central1",
    "checked_on": "2026-11-04",
    "machine_types": {"c4-standard-2": 1.0},
    "disk_per_hour": 0.5,
    "setup_hours_per_vm": 1.0,
}

_METADATA = pd.DataFrame(
    {
        "Size": ["S", "S", "L"] + ["S"] * 10,
        "Problem class": ["LP", "LP", "LP"] + ["LP"] * 10,
    },
    index=["small-1", "small-2", "large-1"] + [f"other-{i}" for i in range(10)],
)


def _vm_yaml(problems, configurations="highs-default", years=(2025,), **fields):
    """Return a VM YAML that runs `problems` with `configurations` in `years`."""
    return {
        "machine-type": "c4-standard-2",
        "zone": "us-central1-a",
        "years": list(years),
        "solver_configuration": configurations,
        "problems": {
            problem_id: {
                "Size": _METADATA.loc[problem_id, "Size"],
                "Problem class": _METADATA.loc[problem_id, "Problem class"],
                "URL": f"https://example.com/{problem_id}.lp",
            }
            for problem_id in problems
        },
        **fields,
    }


def _past_run(problem_id, runtime, status="ok", version="1.12.0", solver="highs"):
    """Return a results row of HiGHS on `problem_id`, with a 1-hour timeout."""
    benchmark, size = problem_id.rsplit("-", 1)
    return {
        "Benchmark": benchmark,
        "Size": size,
        "Solver": solver,
        "Solver Version": version,
        "Status": status,
        "Runtime (s)": runtime,
        "Timeout": 3600,
        "Timestamp": "2026-01-01 00:00:00",
    }


@pytest.fixture
def results_csv(tmp_path):
    """Return a function that writes past runs to a results CSV."""

    def write(rows):
        path = tmp_path / "benchmark_results.csv"
        pd.DataFrame(rows, columns=list(_past_run("a-1", 0))).to_csv(path, index=False)
        return path

    return write


def _estimate(vm_yamls, results_path):
    """Estimate `vm_yamls` with the test VM costs."""
    return estimate_campaign_cost(
        vm_yamls, _METADATA, results_csv=results_path, vm_costs=_VM_COSTS
    )


def test_counts_only_registered_and_eligible_runs(results_csv):
    """Both problems run HiGHS 2025, and only the S one GLPK 2020."""
    vm = _vm_yaml(
        ["small-1", "large-1"],
        configurations="highs-default glpk-default",
        years=(2020, 2025),
    )
    estimate = _estimate([vm], results_csv([]))
    assert estimate.runs == 3


def test_uses_the_past_run_of_the_same_problem_and_version(results_csv):
    """A past run of 30 minutes gives an expected half hour."""
    estimate = _estimate(
        [_vm_yaml(["small-1"])], results_csv([_past_run("small-1", 1800)])
    )
    assert estimate.runs_with_history == 1
    assert estimate.expected_hours == pytest.approx(1.0 + 0.5)
    assert estimate.worst_hours == pytest.approx(1.0 + 1.0)


def test_a_timed_out_past_run_counts_its_whole_timeout(results_csv):
    """A past run that timed out gives the whole timeout."""
    estimate = _estimate(
        [_vm_yaml(["small-1"])], results_csv([_past_run("small-1", None, status="TO")])
    )
    assert estimate.expected_hours == pytest.approx(1.0 + 1.0)


def test_a_past_run_of_another_version_is_not_used(results_csv):
    """Without enough similar runs, a run of another version gives the timeout."""
    estimate = _estimate(
        [_vm_yaml(["small-1"])],
        results_csv([_past_run("small-1", 360, version="1.9.0")]),
    )
    assert estimate.runs_with_history == 0
    assert estimate.expected_hours == pytest.approx(1.0 + 1.0)


def test_uses_the_average_of_similar_problems(results_csv):
    """Ten past runs using 20% of the timeout give an expected 12 minutes."""
    rows = [_past_run(f"other-{i}", 720) for i in range(10)]
    estimate = _estimate([_vm_yaml(["small-1"])], results_csv(rows))
    assert estimate.expected_hours == pytest.approx(1.0 + 0.2)


def test_too_few_similar_runs_give_the_whole_timeout(results_csv):
    """Nine similar past runs are too few for an average."""
    rows = [_past_run(f"other-{i}", 720) for i in range(9)]
    estimate = _estimate([_vm_yaml(["small-1"])], results_csv(rows))
    assert estimate.expected_hours == pytest.approx(1.0 + 1.0)


def test_uses_the_timeout_of_the_vm_yaml(results_csv):
    """A VM YAML's timeout replaces the default of its problems' size."""
    vm = _vm_yaml(["small-1"], timeout_seconds=7200)
    estimate = _estimate([vm], results_csv([]))
    assert estimate.worst_hours == pytest.approx(1.0 + 2.0)


def test_cost_includes_the_disk_and_the_setup_time(results_csv):
    """Two VM-hours at $1 plus $0.5 of disk per hour cost $3."""
    estimate = _estimate([_vm_yaml(["small-1"])], results_csv([]))
    assert estimate.worst_cost == pytest.approx(2.0 * 1.5)


def test_machine_types_without_a_price_are_left_out_of_the_cost(results_csv):
    """A VM of a machine type without a price adds runs but no cost."""
    vm = _vm_yaml(["small-1"])
    vm["machine-type"] = "n2-standard-4"
    estimate = _estimate([vm], results_csv([]))
    assert estimate.runs == 1
    assert estimate.worst_cost == 0
    assert "WARNING" in format_estimate(estimate)


def test_format_notes_vms_outside_the_priced_region(results_csv):
    """VMs outside the region of the prices are pointed out."""
    vm = _vm_yaml(["small-1"], zone="europe-west4-a")
    output = format_estimate(_estimate([vm], results_csv([])))
    assert "1 VM(s) are outside us-central1" in output

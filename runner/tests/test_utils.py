"""Characterization tests for runner/utils.py, as it exists today.

These tests lock in current behavior ahead of the runner/utils.py module
split (issue #478); they are not meant to validate design.
"""

import textwrap

import numpy as np
import pandas as pd
import pytest
from utils import (
    allocate_benchmarks,
    allocate_vms_greedy,
    calculate_sgm,
    compute_summary_results,
    is_solved,
    load_benchmark_metadata,
)


class TestCalculateSgm:
    def test_matches_shifted_geometric_mean_formula(self):
        data = np.array([1.0, 2.0, 3.0])
        sh = 10
        expected = np.exp(np.mean(np.log(data + sh))) - sh
        assert calculate_sgm(data, sh=sh) == pytest.approx(expected)

    def test_default_shift_is_10(self):
        data = np.array([5.0, 15.0])
        assert calculate_sgm(data) == pytest.approx(calculate_sgm(data, sh=10))

    def test_clamps_values_below_negative_shift_plus_one(self):
        # data_points + sh is clamped to a minimum of 1 before taking the log
        data = np.array([-100.0])
        sh = 10
        result = calculate_sgm(data, sh=sh)
        assert result == pytest.approx(np.exp(np.log(1)) - sh)


class TestIsSolved:
    def test_ok_status_is_solved(self):
        assert is_solved(pd.Series({"Status": "ok"})) is True

    @pytest.mark.parametrize("status", ["TO", "ER", "OOM"])
    def test_non_ok_status_is_not_solved(self, status):
        assert is_solved(pd.Series({"Status": status})) is False


class TestComputeSummaryResults:
    def _make_results(self):
        return pd.DataFrame(
            [
                {
                    "Problem class": "LP",
                    "Size Category": "S",
                    "solver-version": "highs-1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Timeout": 3600,
                },
                {
                    "Problem class": "LP",
                    "Size Category": "S",
                    "solver-version": "highs-1.9.0",
                    "Status": "TO",
                    "Runtime (s)": None,
                    "Timeout": 3600,
                },
            ]
        )

    def test_groups_and_counts_solved(self):
        summary = compute_summary_results(self._make_results())
        assert len(summary) == 1
        row = summary.iloc[0]
        assert row["Class"] == "LP"
        assert row["Category"] == "Small"
        assert row["Solver"] == "highs-1.9.0"
        assert row["Solved Instances"] == " 50% (1/2)"

    def test_sgm_uses_runtime_if_solved_else_timeout(self):
        summary = compute_summary_results(self._make_results())
        expected = calculate_sgm(np.array([1.0, 3600]))
        assert summary.iloc[0]["SGM Runtime"] == pytest.approx(expected)

    def test_category_suffix_is_appended(self):
        summary = compute_summary_results(self._make_results(), category_suffix=" (v2)")
        assert summary.iloc[0]["Category"] == "Small (v2)"

    def test_unknown_size_category_raises_keyerror(self):
        df = self._make_results()
        df["Size Category"] = "X"
        with pytest.raises(KeyError):
            compute_summary_results(df)


class TestAllocateVmsGreedy:
    def test_all_instances_allocated_exactly_once(self):
        instances = ["a", "b", "c", "d"]
        weights = {"a": 10, "b": 1, "c": 5, "d": 3}
        allocation, _ = allocate_vms_greedy(instances, weights, num_vms=2)
        allocated = sorted(b for vm in allocation for b in vm)
        assert allocated == sorted(instances)

    def test_num_vms_respected(self):
        instances = ["a", "b", "c"]
        weights = {"a": 1, "b": 1, "c": 1}
        allocation, vm_weights = allocate_vms_greedy(instances, weights, num_vms=3)
        assert len(allocation) == 3
        assert len(vm_weights) == 3

    def test_longest_processing_time_first_balances_load(self):
        # LPT: heaviest items placed first, always into the lightest-loaded VM.
        # Processing order (weight desc, ties broken by instance name desc):
        # a(10) -> VM0 [10,0]; b(9) -> VM1 [10,9]; d(1) -> VM1 [10,10];
        # c(1) -> VM0 (tie, lowest index wins) [11,10].
        instances = ["a", "b", "c", "d"]
        weights = {"a": 10, "b": 9, "c": 1, "d": 1}
        _allocation, vm_weights = allocate_vms_greedy(instances, weights, num_vms=2)
        assert sorted(vm_weights) == [10, 11]

    def test_single_vm_gets_everything(self):
        instances = ["a", "b"]
        weights = {"a": 1, "b": 2}
        allocation, vm_weights = allocate_vms_greedy(instances, weights, num_vms=1)
        assert sorted(allocation[0]) == ["a", "b"]
        assert vm_weights[0] == 3


class TestAllocateBenchmarks:
    def _make_benchmarks_df(self):
        rows = [
            {
                "Benchmark": "bench-a",
                "Instance": "default",
                "Size": "S",
                "URL": "http://example.com/a",
                "Problem class": "LP",
                "weight": 1,
            },
            {
                "Benchmark": "bench-b",
                "Instance": "default",
                "Size": "M",
                "URL": "http://example.com/b",
                "Problem class": "MILP",
                "weight": 2,
            },
        ]
        df = pd.DataFrame(rows)
        df.index = df["Benchmark"]
        return df

    def test_empty_dataframe_returns_empty_list(self):
        assert allocate_benchmarks(pd.DataFrame(), "weight", num_vms=2) == []

    def test_builds_one_yaml_per_vm(self):
        df = self._make_benchmarks_df()
        vm_yamls = allocate_benchmarks(df, "weight", num_vms=2)
        assert len(vm_yamls) == 2
        for vm_yaml in vm_yamls:
            assert set(vm_yaml.keys()) >= {
                "machine-type",
                "zone",
                "years",
                "benchmarks",
            }

    def test_benchmark_grouped_with_sizes_list(self):
        df = self._make_benchmarks_df()
        vm_yamls = allocate_benchmarks(df, "weight", num_vms=1)
        benchmarks = vm_yamls[0]["benchmarks"]
        assert set(benchmarks.keys()) == {"bench-a", "bench-b"}
        assert benchmarks["bench-a"]["Problem class"] == "LP"
        assert benchmarks["bench-a"]["Sizes"] == [
            {"Name": "default", "Size": "S", "URL": "http://example.com/a"}
        ]

    def test_optional_solver_and_timeout_included_when_given(self):
        df = self._make_benchmarks_df()
        vm_yamls = allocate_benchmarks(
            df, "weight", num_vms=1, solvers="highs", timeout_seconds=60
        )
        assert vm_yamls[0]["solver"] == "highs"
        assert vm_yamls[0]["timeout_seconds"] == 60

    def test_optional_solver_and_timeout_omitted_by_default(self):
        df = self._make_benchmarks_df()
        vm_yamls = allocate_benchmarks(df, "weight", num_vms=1)
        assert "solver" not in vm_yamls[0]
        assert "timeout_seconds" not in vm_yamls[0]

    def test_default_machine_type_and_zone(self):
        df = self._make_benchmarks_df()
        vm_yamls = allocate_benchmarks(df, "weight", num_vms=1)
        assert vm_yamls[0]["machine-type"] == "c4-standard-2"
        assert vm_yamls[0]["zone"] == "us-central1-a"


class TestLoadBenchmarkMetadata:
    def test_flat_problems_schema_becomes_dataframe(self, tmp_path):
        metadata_file = tmp_path / "metadata.yaml"
        metadata_file.write_text(
            textwrap.dedent(
                """\
                problems:
                  my-problem:
                    Size: S
                    Problem class: LP
                    URL: http://example.com/my-problem
                    Short description: "should be dropped"
                    Realistic motivation: "should also be dropped"
                """
            )
        )
        df = load_benchmark_metadata(str(metadata_file))
        assert list(df.index) == ["my-problem"]
        assert df.loc["my-problem", "Benchmark"] == "my-problem"
        assert df.loc["my-problem", "Instance"] == "default"
        assert df.loc["my-problem", "Size"] == "S"
        assert df.loc["my-problem", "Problem class"] == "LP"
        assert "Short description" not in df.columns
        assert "Realistic motivation" not in df.columns

    def test_multiple_problems(self, tmp_path):
        metadata_file = tmp_path / "metadata.yaml"
        metadata_file.write_text(
            textwrap.dedent(
                """\
                problems:
                  problem-a:
                    Size: S
                  problem-b:
                    Size: M
                """
            )
        )
        df = load_benchmark_metadata(str(metadata_file))
        assert sorted(df.index) == ["problem-a", "problem-b"]

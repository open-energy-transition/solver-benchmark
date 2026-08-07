"""Tests for runner/utils/campaign.py: allocating problems across VMs for a
benchmark campaign.
"""

import pandas as pd
import yaml

from runner.utils.campaign import allocate_problems, allocate_vms_greedy
from runner.utils.metadata import load_problems


class TestAllocateVmsGreedy:
    def test_all_problems_allocated_exactly_once(self):
        problem_ids = ["a", "b", "c", "d"]
        weights = {"a": 10, "b": 1, "c": 5, "d": 3}
        allocation, _ = allocate_vms_greedy(problem_ids, weights, num_vms=2)
        allocated = sorted(p for vm in allocation for p in vm)
        assert allocated == sorted(problem_ids)

    def test_num_vms_respected(self):
        problem_ids = ["a", "b", "c"]
        weights = {"a": 1, "b": 1, "c": 1}
        allocation, vm_weights = allocate_vms_greedy(problem_ids, weights, num_vms=3)
        assert len(allocation) == 3
        assert len(vm_weights) == 3

    def test_longest_processing_time_first_balances_load(self):
        # LPT: heaviest items placed first, always into the lightest-loaded VM.
        # Processing order (weight desc, ties broken by problem id desc):
        # a(10) -> VM0 [10,0]; b(9) -> VM1 [10,9]; d(1) -> VM1 [10,10];
        # c(1) -> VM0 (tie, lowest index wins) [11,10].
        problem_ids = ["a", "b", "c", "d"]
        weights = {"a": 10, "b": 9, "c": 1, "d": 1}
        _allocation, vm_weights = allocate_vms_greedy(problem_ids, weights, num_vms=2)
        assert sorted(vm_weights) == [10, 11]

    def test_single_vm_gets_everything(self):
        problem_ids = ["a", "b"]
        weights = {"a": 1, "b": 2}
        allocation, vm_weights = allocate_vms_greedy(problem_ids, weights, num_vms=1)
        assert sorted(allocation[0]) == ["a", "b"]
        assert vm_weights[0] == 3


class TestAllocateProblems:
    def _make_problems_df(self):
        rows = [
            {
                "Problem": "problem-a",
                "Size": "S",
                "URL": "http://example.com/a",
                "Problem class": "LP",
                "weight": 1,
            },
            {
                "Problem": "problem-b",
                "Size": "M",
                "URL": "http://example.com/b",
                "Problem class": "MILP",
                "weight": 2,
            },
        ]
        df = pd.DataFrame(rows)
        df.index = df["Problem"]
        return df

    def test_empty_dataframe_returns_empty_list(self):
        assert allocate_problems(pd.DataFrame(), "weight", num_vms=2) == []

    def test_builds_one_yaml_per_vm(self):
        df = self._make_problems_df()
        vm_yamls = allocate_problems(df, "weight", num_vms=2)
        assert len(vm_yamls) == 2
        for vm_yaml in vm_yamls:
            assert set(vm_yaml.keys()) >= {"machine-type", "zone", "years", "problems"}

    def test_flat_problems_schema(self):
        df = self._make_problems_df()
        vm_yamls = allocate_problems(df, "weight", num_vms=1)
        problems = vm_yamls[0]["problems"]
        assert set(problems.keys()) == {"problem-a", "problem-b"}
        assert problems["problem-a"] == {
            "Problem class": "LP",
            "Size": "S",
            "URL": "http://example.com/a",
        }

    def test_optional_solver_and_timeout_included_when_given(self):
        df = self._make_problems_df()
        vm_yamls = allocate_problems(
            df, "weight", num_vms=1, solvers="highs", timeout_seconds=60
        )
        assert vm_yamls[0]["solver"] == "highs"
        assert vm_yamls[0]["timeout_seconds"] == 60

    def test_optional_solver_and_timeout_omitted_by_default(self):
        df = self._make_problems_df()
        vm_yamls = allocate_problems(df, "weight", num_vms=1)
        assert "solver" not in vm_yamls[0]
        assert "timeout_seconds" not in vm_yamls[0]

    def test_default_machine_type_and_zone(self):
        df = self._make_problems_df()
        vm_yamls = allocate_problems(df, "weight", num_vms=1)
        assert vm_yamls[0]["machine-type"] == "c4-standard-2"
        assert vm_yamls[0]["zone"] == "us-central1-a"

    def test_round_trips_through_load_problems(self, tmp_path, mocker):
        # allocate_problems' output is meant to be read back by
        # metadata.load_problems (both use the flat "problems" schema) --
        # round-trip through a real file to confirm they actually agree,
        # not just that this module's own shape looks plausible.
        download_mock = mocker.patch("runner.utils.metadata.download_benchmark_file")
        df = pd.DataFrame(
            [
                {
                    "Problem": "problem-a",
                    "Size": "S",
                    "URL": "http://example.com/problem-a.lp",
                    "Problem class": "LP",
                    "weight": 1,
                }
            ]
        )
        df.index = df["Problem"]
        vm_yamls = allocate_problems(df, "weight", num_vms=1)

        problems_yaml = tmp_path / "vm-00.yaml"
        with open(problems_yaml, "w") as f:
            yaml.dump(vm_yamls[0], f)

        problems = load_problems(problems_yaml, tmp_path / "downloads")
        assert problems[0]["problem_id"] == "problem-a"
        download_mock.assert_called_once_with(
            "http://example.com/problem-a.lp", tmp_path / "downloads" / "problem-a.lp"
        )

"""Tests for runner/utils/campaign.py: allocating problems across VMs for a
benchmark campaign, and checking a campaign before launch.
"""

import subprocess

import pandas as pd
import pytest
import yaml

from runner.utils import campaign
from runner.utils.campaign import (
    allocate_problems,
    allocate_vms_greedy,
    validate_campaign,
)
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
            df, "weight", num_vms=1, solvers="highs-default", timeout_seconds=60
        )
        assert vm_yamls[0]["solver_configuration"] == "highs-default"
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


_VALID_VM_YAML = {
    "machine-type": "c4-standard-2",
    "years": [2025],
    "solver_configuration": "highs-default",
    "problems": {
        "problem-a": {
            "Problem class": "LP",
            "Size": "S",
            "URL": "http://example.com/problem-a.lp",
        }
    },
}


class TestValidateCampaign:
    @pytest.fixture
    def bench_dir(self, tmp_path, mocker):
        # The git checks are tested separately
        mocker.patch.object(campaign, "_check_git_state", return_value=([], []))
        (tmp_path / "run.tfvars").write_text(
            'run_id = "test-run"\ngit_ref = "main"  # a comment\n'
        )
        return tmp_path

    def _write_vm(self, bench_dir, name, data):
        with open(bench_dir / f"{name}.yaml", "w") as f:
            yaml.dump(data, f)

    def test_valid_campaign_passes(self, bench_dir):
        self._write_vm(bench_dir, "test-00", _VALID_VM_YAML)
        assert validate_campaign(bench_dir) == ([], [])

    def test_missing_tfvars(self, tmp_path):
        errors, _ = validate_campaign(tmp_path)
        assert "run.tfvars not found" in errors[0]

    def test_no_vm_files(self, bench_dir):
        errors, _ = validate_campaign(bench_dir)
        assert "no VM YAML files" in errors[0]

    @pytest.mark.parametrize("name", ["Test_00", "test-00-", "x" * 50])
    def test_invalid_vm_name(self, bench_dir, name):
        # main.tf names the VM "benchmark-instance-<file stem>"
        self._write_vm(bench_dir, name, _VALID_VM_YAML)
        errors, _ = validate_campaign(bench_dir)
        assert len(errors) == 1
        assert "not a valid GCE name" in errors[0]

    def test_instance_name_from_tfvars(self, bench_dir):
        with open(bench_dir / "run.tfvars", "a") as f:
            f.write('instance_name = "Bad_Prefix"\n')
        self._write_vm(bench_dir, "test-00", _VALID_VM_YAML)
        errors, _ = validate_campaign(bench_dir)
        assert "'Bad_Prefix-test-00'" in errors[0]

    def test_missing_problem_fields(self, bench_dir):
        data = dict(_VALID_VM_YAML, problems={"problem-a": {"Size": "S"}})
        self._write_vm(bench_dir, "test-00", data)
        errors, _ = validate_campaign(bench_dir)
        assert errors == [
            "test-00.yaml: problem 'problem-a' is missing Problem class, URL"
        ]

    def test_no_problems(self, bench_dir):
        self._write_vm(bench_dir, "test-00", dict(_VALID_VM_YAML, problems={}))
        errors, _ = validate_campaign(bench_dir)
        assert errors == ["test-00.yaml: no problems listed under 'problems'"]

    def test_unknown_year_and_configuration(self, bench_dir):
        data = dict(
            _VALID_VM_YAML,
            years=[2025, 1999],
            solver_configuration="highs-default not-a-solver",
        )
        self._write_vm(bench_dir, "test-00", data)
        errors, _ = validate_campaign(bench_dir)
        assert errors == [
            "test-00.yaml: no solver versions registered for year(s) 1999",
            "test-00.yaml: unknown solver configuration(s) not-a-solver",
        ]


class TestCheckGitState:
    def _fake_git(self, mocker, *, status="", branch="main", head="abc", remote=None):
        """Patch subprocess.run to answer the git commands _check_git_state runs."""
        if remote is None:
            remote = (0, f"{head}\trefs/heads/main\n")

        def run(command, **kwargs):
            subcommand = command[1]
            if subcommand == "status":
                return subprocess.CompletedProcess(command, 0, status, "")
            if subcommand == "rev-parse" and "--abbrev-ref" in command:
                return subprocess.CompletedProcess(command, 0, branch + "\n", "")
            if subcommand == "rev-parse":
                return subprocess.CompletedProcess(command, 0, head + "\n", "")
            if subcommand == "ls-remote":
                return subprocess.CompletedProcess(command, remote[0], remote[1], "")
            raise AssertionError(f"unexpected command {command}")

        mocker.patch.object(campaign.subprocess, "run", side_effect=run)

    def test_clean_checkout_of_pushed_ref(self, tmp_path, mocker):
        self._fake_git(mocker)
        assert campaign._check_git_state("main", tmp_path) == ([], [])

    def test_uncommitted_changes_warn(self, tmp_path, mocker):
        self._fake_git(mocker, status=" M runner/benchmark.py\n?? new.py\n")
        errors, warnings = campaign._check_git_state("main", tmp_path)
        assert errors == []
        assert "2 uncommitted or untracked change(s)" in warnings[0]

    def test_other_branch_checked_out_warns(self, tmp_path, mocker):
        self._fake_git(mocker, branch="feature")
        errors, warnings = campaign._check_git_state("main", tmp_path)
        assert errors == []
        assert "'feature' is checked out" in warnings[0]

    def test_unpushed_commits_warn(self, tmp_path, mocker):
        self._fake_git(mocker, head="local", remote=(0, "remote\trefs/heads/main\n"))
        errors, warnings = campaign._check_git_state("main", tmp_path)
        assert errors == []
        assert "differs from GitHub" in warnings[0]

    def test_ref_missing_on_github_is_an_error(self, tmp_path, mocker):
        self._fake_git(mocker, remote=(2, ""))
        errors, _ = campaign._check_git_state("main", tmp_path)
        assert "not a branch or tag on GitHub" in errors[0]

    def test_unreachable_github_warns(self, tmp_path, mocker):
        self._fake_git(mocker, remote=(128, ""))
        errors, warnings = campaign._check_git_state("main", tmp_path)
        assert errors == []
        assert "could not check 'main' on GitHub" in warnings[0]

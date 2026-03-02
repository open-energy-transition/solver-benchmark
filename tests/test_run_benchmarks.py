"""Unit tests for the run_benchmarks module."""
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

from runner import run_benchmarks
from runner.run_benchmarks import get_conda_package_versions, build_solver_command


class TestRunBenchmarks:
    def test_get_conda_package_versions(self) -> None:
        """Test the get_conda_package_versions function."""
        solvers_list = ["highs", "highs-hipo", "highs-ipm", "cbc", "scip"]
        env_name = "benchmark-env"
        # Simulate conda list output
        conda_list_output = """
        # packages in environment at /opt/conda/envs/fake-env:
        #
        highspy                   1.13.2.dev1         py39_0
        coin-or-cbc               2.10.12             py39_0
        pyscipopt                 5.7.1               py39_0
        otherpkg                  0.1.0               py39_0
        """
        mock_result = MagicMock()
        mock_result.stdout = conda_list_output
        mock_result.returncode = 0

        expected_dict = {
            "highs": "1.13.2.dev1",
            "highs-hipo": "1.13.2.dev1",
            "highs-ipm": "1.13.2.dev1",
            "cbc": "2.10.12",
            "scip": "5.7.1",
        }

        with patch("subprocess.run", return_value=mock_result):
            versions = get_conda_package_versions(solvers_list, env_name)
            assert versions == expected_dict

    def test_build_command_non_root_includes_user_and_reference_flag(self, monkeypatch: MagicMock) -> None:
        """Test that the command includes --user and --highs_solver_variant hipo when not running as root."""
        monkeypatch.setattr(os, "geteuid", lambda: 1000)  # non-root
        input_file = Path("/tmp/example_problem.lp")
        solver_name = "highs"
        timeout = 60
        solver_version = "1.2.3"
        memory_limit_bytes = 12345678

        cmd = build_solver_command(
            input_file, solver_name, timeout, solver_version, memory_limit_bytes, True
        )

        assert cmd[0] == "systemd-run"
        assert "--user" in cmd
        assert f"--property=MemoryMax={memory_limit_bytes}" in cmd
        assert "--property=MemorySwapMax=0" in cmd
        assert "/usr/bin/time" in cmd
        assert "--format" in cmd
        assert "MaxResidentSetSizeKB=%M" in cmd
        assert "timeout" in cmd
        assert f"{timeout}s" in cmd
        expected_wrapper = str(Path(run_benchmarks.__file__).parent / "run_solver.py")
        assert expected_wrapper in cmd
        assert f"--solver_name {solver_name}" in cmd
        assert f"--input_file {input_file.as_posix()}" in cmd
        assert f"--solver_version {solver_version}" in cmd
        assert "--highs_solver_variant hipo" in cmd

    def test_build_command_as_root_no_user_and_no_reference(self, monkeypatch: MagicMock) -> None:
        """Test that the command does not include --user and --highs_solver_variant hipo"""
        monkeypatch.setattr(os, "geteuid", lambda: 0)  # root
        input_file = Path("/tmp/another.lp")
        solver_name = "cbc"
        timeout = 30
        solver_version = "2.0"
        memory_limit_bytes = 99999

        cmd = build_solver_command(
            input_file, solver_name, timeout, solver_version, memory_limit_bytes, False
        )

        assert "--user" not in cmd
        assert f"--property=MemoryMax={memory_limit_bytes}" in cmd
        assert f"{timeout}s" in cmd
        assert f"--solver_name {solver_name}" in cmd
        assert f"--input_file {input_file.as_posix()}" in cmd
        assert f"--solver_version {solver_version}" in cmd
        assert not any(el == "--highs_solver_variant hipo" for el in cmd)

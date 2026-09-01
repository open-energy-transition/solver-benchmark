"""Tests for runner/utils/execution.py: running a solver as a resource-limited
subprocess and parsing back its reported memory usage.
"""

import subprocess

import pytest

from runner.utils.execution import parse_memory, run_solver


class TestParseMemory:
    def test_parses_kb_to_mb(self):
        output = "some log line\nMaxResidentSetSizeKB=204800"
        assert parse_memory(output) == pytest.approx(204.8)

    def test_uses_last_line_only(self):
        output = "MaxResidentSetSizeKB=999999\nMaxResidentSetSizeKB=1000"
        assert parse_memory(output) == pytest.approx(1.0)

    def test_missing_marker_raises(self):
        with pytest.raises(ValueError, match="Could not find memory usage"):
            parse_memory("no memory info here")


class TestRunSolver:
    def _run(self, mocker, completed_process):
        mocker.patch("runner.utils.execution._systemd_available", return_value=False)
        run_mock = mocker.patch(
            "runner.utils.execution.subprocess.run", return_value=completed_process
        )
        metrics = run_solver(
            "problem.lp", "highs", timeout=3600, solver_version="1.9.0"
        )
        return metrics, run_mock

    def test_timeout_returncode_124(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        metrics, _ = self._run(mocker, cp)
        assert metrics["status"] == "TO"
        assert metrics["condition"] == "Timeout"
        assert metrics["runtime"] == 3600
        assert metrics["timeout"] == 3600

    @pytest.mark.parametrize("returncode", [137, 143, -9, -15])
    def test_oom_returncodes(self, mocker, returncode):
        cp = subprocess.CompletedProcess(
            args=[],
            returncode=returncode,
            stdout="",
            stderr="MaxResidentSetSizeKB=1000",
        )
        metrics, _ = self._run(mocker, cp)
        assert metrics["status"] == "OOM"
        assert metrics["condition"] == "Out of Memory"
        assert metrics["runtime"] == "N/A"

    def test_other_nonzero_returncode_is_error(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=1, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        metrics, _ = self._run(mocker, cp)
        assert metrics["status"] == "ER"
        assert metrics["condition"] == "Error"
        assert metrics["runtime"] == 3600  # errors report `timeout`s, like TO

    def test_success_parses_json_from_last_stdout_line(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout='{"status": "ok", "condition": "optimal", "objective": 1.0, '
            '"runtime": 12.3, "reported_runtime": 12.0, "duality_gap": null, '
            '"max_integrality_violation": null}',
            stderr="MaxResidentSetSizeKB=2048",
        )
        metrics, _ = self._run(mocker, cp)
        assert metrics["status"] == "ok"
        assert metrics["objective"] == 1.0
        assert metrics["memory"] == pytest.approx(2.048)

    def test_memory_none_when_unparseable(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="no memory info here"
        )
        metrics, _ = self._run(mocker, cp)
        assert metrics["memory"] is None

    @pytest.mark.xfail(
        strict=True,
        reason=(
            "Known bug: parse_memory() does output.splitlines()[-1] with no "
            "guard for empty output, and run_solver only catches ValueError "
            "around that call, so a completely empty stderr (e.g. "
            "/usr/bin/time never got to run) crashes with an uncaught "
            "IndexError instead of leaving memory=None. Remove this xfail "
            "once that's fixed."
        ),
    )
    def test_empty_stderr_leaves_memory_none(self, mocker):
        cp = subprocess.CompletedProcess(args=[], returncode=124, stdout="", stderr="")
        metrics, _ = self._run(mocker, cp)
        assert metrics["memory"] is None

    def test_command_invokes_solver_module_via_dash_m(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        _, run_mock = self._run(mocker, cp)
        called_cmd = run_mock.call_args[0][0]
        assert called_cmd[-4:] == [
            "runner.utils.solver",
            "highs",
            "problem.lp",
            "1.9.0",
        ]
        assert called_cmd[called_cmd.index("runner.utils.solver") - 1] == "-m"

    def test_env_name_uses_pixi_run(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        mocker.patch("runner.utils.execution._systemd_available", return_value=False)
        run_mock = mocker.patch(
            "runner.utils.execution.subprocess.run", return_value=cp
        )
        run_solver(
            "problem.lp",
            "highs",
            timeout=3600,
            solver_version="1.9.0",
            env_name="benchmark-highs-2025",
        )
        called_cmd = run_mock.call_args[0][0]
        assert "pixi" in called_cmd
        assert "run" in called_cmd
        assert called_cmd[called_cmd.index("--manifest-path") + 1].endswith(
            "benchmark-highs-2025"
        )

    def test_pythonpath_is_prepended_with_repo_root(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        _, run_mock = self._run(mocker, cp)
        from runner.utils.execution import _REPO_ROOT

        subprocess_env = run_mock.call_args.kwargs["env"]
        assert str(_REPO_ROOT) in subprocess_env["PYTHONPATH"]

    def test_systemd_run_forwards_set_license_env_vars(self, mocker, monkeypatch):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        mocker.patch("runner.utils.execution._systemd_available", return_value=True)
        mocker.patch("runner.utils.execution.os.geteuid", return_value=1000)
        mocker.patch(
            "runner.utils.execution.config.resolve_solver_name", return_value="mosek"
        )
        mocker.patch(
            "runner.utils.execution.config.get_license_env_vars",
            return_value=["MOSEKLM_LICENSE_FILE", "UNSET_LICENSE_VAR"],
        )
        monkeypatch.setenv("MOSEKLM_LICENSE_FILE", "/opt/mosek/license.lic")
        monkeypatch.delenv("UNSET_LICENSE_VAR", raising=False)
        run_mock = mocker.patch(
            "runner.utils.execution.subprocess.run", return_value=cp
        )
        run_solver(
            "problem.lp", "mosek-default", timeout=3600, solver_version="11.0.30"
        )
        called_cmd = run_mock.call_args[0][0]
        assert "--setenv=MOSEKLM_LICENSE_FILE=/opt/mosek/license.lic" in called_cmd
        assert not any("UNSET_LICENSE_VAR" in part for part in called_cmd)

    def test_systemd_run_skips_forwarding_for_solver_with_no_license_env_vars(
        self, mocker
    ):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        mocker.patch("runner.utils.execution._systemd_available", return_value=True)
        mocker.patch("runner.utils.execution.os.geteuid", return_value=1000)
        run_mock = mocker.patch(
            "runner.utils.execution.subprocess.run", return_value=cp
        )
        run_solver("problem.lp", "highs-default", timeout=3600, solver_version="1.9.0")
        called_cmd = run_mock.call_args[0][0]
        assert not any("--setenv=" in part for part in called_cmd)

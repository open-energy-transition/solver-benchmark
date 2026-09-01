"""Tests for runner/utils/env.py: installed vs. registered solver version
introspection.
"""

import subprocess

import pytest

from runner.utils.env import (
    ensure_solver_envs_installed,
    get_installed_solver_versions,
    get_registered_solver_versions,
)


class TestGetInstalledSolverVersions:
    def test_parses_package_versions(self, mocker):
        stdout = (
            "# packages in environment:\n"
            "#\n"
            "\n"
            "highspy                  1.9.0                    pypi\n"
            "coin-or-cbc               2.10.5                   h123\n"
        )
        mocker.patch(
            "runner.utils.env.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=["conda", "list"], returncode=0, stdout=stdout, stderr=""
            ),
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", side_effect=lambda name: name
        )
        mocker.patch(
            "runner.utils.env.config.get_conda_package_name",
            side_effect={"highs": "highspy", "cbc": "coin-or-cbc"}.get,
        )
        result = get_installed_solver_versions(["highs", "cbc", "unknown-solver"])
        assert result == {
            "highs": "1.9.0",
            "cbc": "2.10.5",
            "unknown-solver": None,
        }

    def test_resolves_configuration_name_before_package_lookup(self, mocker):
        # A configuration like "highs-hipo" shares its solver's package, so
        # the lookup must resolve through config.resolve_solver_name first.
        stdout = "highspy                  1.9.0                    pypi\n"
        mocker.patch(
            "runner.utils.env.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout=stdout, stderr=""
            ),
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name",
            return_value="highs",
        )
        mocker.patch(
            "runner.utils.env.config.get_conda_package_name",
            return_value="highspy",
        )
        result = get_installed_solver_versions(["highs-hipo"])
        assert result == {"highs-hipo": "1.9.0"}

    def test_passes_env_name_to_conda_list(self, mocker):
        run_mock = mocker.patch(
            "runner.utils.env.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout="", stderr=""
            ),
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", return_value="highs"
        )
        mocker.patch(
            "runner.utils.env.config.get_conda_package_name", return_value="highspy"
        )
        get_installed_solver_versions(["highs"], env_name="benchmark-highs-2025")
        called_cmd = run_mock.call_args[0][0]
        assert called_cmd == ["bash", "-i", "-c", "conda list -n benchmark-highs-2025"]

    def test_called_process_error_raises_value_error(self, mocker):
        mocker.patch(
            "runner.utils.env.subprocess.run",
            side_effect=subprocess.CalledProcessError(1, "conda list", stderr="boom"),
        )
        with pytest.raises(ValueError, match="boom"):
            get_installed_solver_versions(["highs"])


class TestGetRegisteredSolverVersions:
    _REGISTRY = {
        "solvers": {
            "highs": {
                "1.9.0": {"year": 2024, "env": "benchmark-highs-2024"},
                "1.12.0": {"year": 2025, "env": "benchmark-highs-2025"},
            },
        }
    }

    def test_looks_up_version_and_env_for_year(self, mocker):
        mocker.patch(
            "runner.utils.env.config.load_solver_registry", return_value=self._REGISTRY
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", side_effect=lambda name: name
        )
        result = get_registered_solver_versions(["highs"], "2025")
        assert result == {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}

    def test_configuration_resolves_to_underlying_solver(self, mocker):
        mocker.patch(
            "runner.utils.env.config.load_solver_registry", return_value=self._REGISTRY
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", return_value="highs"
        )
        result = get_registered_solver_versions(["highs-hipo"], "2024")
        assert result == {
            "highs-hipo": {"version": "1.9.0", "env": "benchmark-highs-2024"}
        }

    def test_no_matching_year_is_omitted(self, mocker):
        mocker.patch(
            "runner.utils.env.config.load_solver_registry", return_value=self._REGISTRY
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", side_effect=lambda name: name
        )
        result = get_registered_solver_versions(["highs"], "2020")
        assert result == {}

    def test_unregistered_solver_is_omitted(self, mocker):
        mocker.patch(
            "runner.utils.env.config.load_solver_registry", return_value=self._REGISTRY
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", side_effect=lambda name: name
        )
        result = get_registered_solver_versions(["not-a-solver"], "2025")
        assert result == {}

    def test_tests_pseudo_year_reads_the_tests_block_instead(self, mocker):
        # "tests" is CI's shared smoke-test env, not a real release year, so
        # it's looked up from the registry's separate `tests` block rather
        # than matched against any solver's per-year `year` entries.
        registry = {
            **self._REGISTRY,
            "tests": {"highs": {"version": "1.9.0", "env": "benchmark-tests"}},
        }
        mocker.patch(
            "runner.utils.env.config.load_solver_registry", return_value=registry
        )
        mocker.patch(
            "runner.utils.env.config.resolve_solver_name", side_effect=lambda name: name
        )
        result = get_registered_solver_versions(["highs", "scip"], "tests")
        assert result == {"highs": {"version": "1.9.0", "env": "benchmark-tests"}}


class TestEnsureSolverEnvsInstalled:
    _EXISTING_ENVS_OUTPUT = (
        "# conda environments:\n"
        "#\n"
        "base                  *  /opt/conda\n"
        "benchmark-highs-2025     /opt/conda/envs/benchmark-highs-2025\n"
    )

    def test_no_envs_needed_is_a_noop(self, mocker):
        run_mock = mocker.patch("runner.utils.env.subprocess.run")
        ensure_solver_envs_installed({"highs": {"version": "1.12.0", "env": None}})
        run_mock.assert_not_called()

    def test_existing_env_is_reused_not_recreated(self, mocker, capsys):
        run_mock = mocker.patch(
            "runner.utils.env.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout=self._EXISTING_ENVS_OUTPUT, stderr=""
            ),
        )
        ensure_solver_envs_installed(
            {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}
        )
        # Only the "conda env list" call, no "conda env create"
        run_mock.assert_called_once()
        assert "already exists; reusing" in capsys.readouterr().out

    def test_missing_env_is_created_from_fixed_yaml_when_present(
        self, mocker, tmp_path
    ):
        mocker.patch("runner.utils.env._ENVS_DIR", tmp_path)
        (tmp_path / "benchmark-highs-2025-fixed.yaml").write_text(
            "name: benchmark-highs-2025"
        )
        (tmp_path / "benchmark-highs-2025.yaml").write_text(
            "name: benchmark-highs-2025"
        )

        run_mock = mocker.patch(
            "runner.utils.env.subprocess.run",
            side_effect=[
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="# no envs\n", stderr=""
                ),
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="", stderr=""
                ),
            ],
        )
        ensure_solver_envs_installed(
            {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}
        )
        create_cmd = run_mock.call_args_list[1][0][0]
        assert create_cmd[:3] == ["conda", "env", "create"]
        assert create_cmd[create_cmd.index("-f") + 1].endswith("-fixed.yaml")

    def test_missing_env_falls_back_to_loose_yaml(self, mocker, tmp_path):
        mocker.patch("runner.utils.env._ENVS_DIR", tmp_path)
        (tmp_path / "benchmark-highs-2025.yaml").write_text(
            "name: benchmark-highs-2025"
        )

        run_mock = mocker.patch(
            "runner.utils.env.subprocess.run",
            side_effect=[
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="# no envs\n", stderr=""
                ),
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="", stderr=""
                ),
            ],
        )
        ensure_solver_envs_installed(
            {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}
        )
        create_cmd = run_mock.call_args_list[1][0][0]
        assert create_cmd[create_cmd.index("-f") + 1].endswith(
            "benchmark-highs-2025.yaml"
        )

    def test_missing_env_yaml_is_skipped_with_warning(self, mocker, tmp_path, capsys):
        mocker.patch("runner.utils.env._ENVS_DIR", tmp_path)
        mocker.patch(
            "runner.utils.env.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout="# no envs\n", stderr=""
            ),
        )
        ensure_solver_envs_installed(
            {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}
        )
        assert "WARNING: No YAML found" in capsys.readouterr().out

    def test_failed_create_is_logged_not_raised(self, mocker, tmp_path, capsys):
        mocker.patch("runner.utils.env._ENVS_DIR", tmp_path)
        (tmp_path / "benchmark-highs-2025.yaml").write_text(
            "name: benchmark-highs-2025"
        )
        mocker.patch(
            "runner.utils.env.subprocess.run",
            side_effect=[
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="# no envs\n", stderr=""
                ),
                subprocess.CompletedProcess(
                    args=[], returncode=1, stdout="", stderr="boom"
                ),
            ],
        )
        ensure_solver_envs_installed(
            {"highs": {"version": "1.12.0", "env": "benchmark-highs-2025"}}
        )
        assert "WARNING: Failed to create env" in capsys.readouterr().out

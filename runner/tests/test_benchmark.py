"""Tests for runner/benchmark.py: the unified multi-year CLI tying
config/env/orchestrator together, replacing the old run_benchmarks.py +
benchmark_all.sh pair.
"""

import textwrap

import pandas as pd
import pytest
from typer.testing import CliRunner

from runner import benchmark
from runner.utils import orchestrator

runner_cli = CliRunner()

_FAKE_METRICS = {
    "status": "ok",
    "condition": "Optimal",
    "objective": 1.0,
    "runtime": 0.5,
    "reported_runtime": 0.4,
    "duality_gap": 0.0,
    "max_integrality_violation": 0.0,
    "memory": 12.3,
}


@pytest.fixture
def problems_yaml(tmp_path):
    problem_file = tmp_path / "problem.lp"
    problem_file.write_text("Minimize\nobj: x\n")
    path = tmp_path / "problems.yaml"
    path.write_text(
        textwrap.dedent(
            f"""\
            problems:
              tiny-problem:
                Path: {problem_file}
                Size: S
                Problem class: LP
            """
        )
    )
    return path


@pytest.fixture(autouse=True)
def _patch_repo_paths(tmp_path, mocker):
    mocker.patch.object(orchestrator, "_REPO_ROOT", tmp_path)
    mocker.patch.object(orchestrator, "_PROBLEMS_FOLDER", tmp_path / "problems")
    mocker.patch.object(
        orchestrator,
        "_gather_environment_metadata",
        return_value={
            "hostname": "h",
            "vm_instance_type": "unknown",
            "vm_zone": "unknown",
            "solver_benchmark_version": "deadbeef",
        },
    )
    mocker.patch.object(orchestrator, "run_solver", return_value=dict(_FAKE_METRICS))
    # Env creation talks to conda; not this CLI's concern to test again here
    # (see test_env.py's TestEnsureSolverEnvsInstalled).
    mocker.patch("runner.benchmark.env.ensure_solver_envs_installed")
    return tmp_path


class TestBenchmarkCli:
    def test_single_year_run_writes_results(self, problems_yaml, tmp_path):
        result = runner_cli.invoke(
            benchmark.app,
            [str(problems_yaml), "--years", "2025", "--solvers", "highs"],
        )
        assert result.exit_code == 0, result.output
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Problem"]) == ["tiny-problem"]
        assert results.iloc[0]["Solver Release Year"] == 2025

    def test_defaults_solvers_to_default_configurations(self, problems_yaml, mocker):
        mocker.patch(
            "runner.benchmark.config.get_default_configurations",
            return_value=["highs"],
        )
        result = runner_cli.invoke(
            benchmark.app, [str(problems_yaml), "--years", "2025"]
        )
        assert result.exit_code == 0, result.output
        assert "Running solver highs" in result.output

    def test_defaults_years_to_every_registered_year(self, problems_yaml, mocker):
        mocker.patch(
            "runner.benchmark.config.get_all_registered_years",
            return_value=["2024"],
        )
        result = runner_cli.invoke(
            benchmark.app, [str(problems_yaml), "--solvers", "highs"]
        )
        assert result.exit_code == 0, result.output
        assert "Running benchmarks for year 2024" in result.output
        assert "2025" not in result.output.split("run ID")[0]

    def test_first_year_overwrites_subsequent_years_append(
        self, problems_yaml, tmp_path
    ):
        result = runner_cli.invoke(
            benchmark.app,
            [
                str(problems_yaml),
                "--years",
                "2024",
                "--years",
                "2025",
                "--solvers",
                "highs",
                "--run-id",
                "multi-year",
            ],
        )
        assert result.exit_code == 0, result.output
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert sorted(results["Solver Release Year"]) == [2024, 2025]

    def test_append_flag_preserves_prior_run_on_first_year(
        self, problems_yaml, tmp_path
    ):
        results_csv = tmp_path / "results" / "benchmark_results.csv"
        mean_stddev_csv = tmp_path / "results" / "benchmark_results_mean_stddev.csv"
        results_csv.parent.mkdir(parents=True)
        # Both files must already exist for append to skip rewriting headers
        # (orchestrator.run_benchmark checks both, see its own docstring).
        mean_stddev_csv.write_text("Problem,Solver\n")
        results_csv.write_text(
            "Problem,Solver,Solver Version,Solver Release Year,Status,Termination "
            "Condition,Runtime (s),Memory Usage (MB),Objective Value,Max "
            "Integrality Violation,Duality Gap,Reported Runtime (s),Timeout,"
            "Hostname,Run ID,Timestamp,VM Instance Type,VM Zone,Solver benchmark "
            "version\nprior-problem,highs,1.9.0,2024,ok,Optimal,1.0,10.0,1.0,0.0,"
            "0.0,1.0,,h,old-run,2024-01-01 00:00:00,unknown,unknown,abc\n"
        )
        result = runner_cli.invoke(
            benchmark.app,
            [str(problems_yaml), "--years", "2025", "--solvers", "highs", "--append"],
        )
        assert result.exit_code == 0, result.output
        results = pd.read_csv(results_csv)
        assert set(results["Problem"]) == {"prior-problem", "tiny-problem"}

    def test_run_id_is_shared_across_all_years(self, problems_yaml, tmp_path):
        result = runner_cli.invoke(
            benchmark.app,
            [
                str(problems_yaml),
                "--years",
                "2024",
                "--years",
                "2025",
                "--solvers",
                "highs",
            ],
        )
        assert result.exit_code == 0, result.output
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert results["Run ID"].nunique() == 1

    def test_a_failing_year_does_not_abort_remaining_years(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator,
            "run_solver",
            side_effect=[Exception("boom"), dict(_FAKE_METRICS)],
        )
        result = runner_cli.invoke(
            benchmark.app,
            [
                str(problems_yaml),
                "--years",
                "2024",
                "--years",
                "2025",
                "--solvers",
                "highs",
            ],
        )
        assert result.exit_code == 0, result.output
        assert "ERROR running benchmarks for year 2024" in result.output
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Solver Release Year"]) == [2025]

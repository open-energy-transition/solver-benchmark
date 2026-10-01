"""Tests for runner/utils/orchestrator.py: the per-problem run loop tying
metadata, config, env, execution, and results together.
"""

import textwrap
from types import SimpleNamespace

import pandas as pd
import pytest

from runner.utils import orchestrator

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

_ENV_METADATA = {
    "hostname": "h",
    "vm_instance_type": "unknown",
    "vm_zone": "unknown",
    "solver_benchmark_version": "deadbeef",
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
        orchestrator, "_gather_environment_metadata", return_value=dict(_ENV_METADATA)
    )
    return tmp_path


class TestRunBenchmark:
    def test_writes_new_schema_results_csv(self, problems_yaml, tmp_path, mocker):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )

        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Problem"]) == ["tiny-problem"]
        assert "Size" not in results.columns
        assert results.iloc[0]["Solver"] == "highs-default"
        assert results.iloc[0]["Status"] == "ok"

    def test_return_value_keyed_by_problem_solver_version(self, problems_yaml, mocker):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        results = orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )
        assert set(results.keys()) == {("tiny-problem", "highs-default", "1.12.0")}

    def test_ineligible_solver_is_skipped(self, problems_yaml, tmp_path, mocker):
        run_solver_mock = mocker.patch.object(orchestrator, "run_solver")
        # highs-hipo is only eligible for LP problems from 2026 on -- 2025
        # should be filtered out before run_solver is ever invoked.
        orchestrator.run_benchmark(
            problems_yaml, ["highs-hipo"], years=["2025"], run_id="test-run"
        )
        run_solver_mock.assert_not_called()

    def test_unregistered_solver_is_skipped(self, problems_yaml, mocker):
        run_solver_mock = mocker.patch.object(orchestrator, "run_solver")
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2019"], run_id="test-run"
        )
        run_solver_mock.assert_not_called()

    def test_run_id_is_auto_generated_when_not_given(self, problems_yaml, mocker):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        mocker.patch(
            "runner.utils.orchestrator.time.strftime", return_value="20260101_000000"
        )
        results = orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"]
        )
        assert results

    def test_append_false_overwrites_existing_results(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        results_csv = tmp_path / "results" / "benchmark_results.csv"
        results_csv.parent.mkdir(parents=True)
        results_csv.write_text("stale header\nstale,row\n")

        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            append=False,
        )
        results = pd.read_csv(results_csv)
        assert "Problem" in results.columns

    def test_multiple_seeds_computes_mean_and_stddev(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=2,
        )
        summary = pd.read_csv(
            tmp_path / "results" / "benchmark_results_mean_stddev.csv"
        )
        assert summary.iloc[0]["Runtime StdDev (s)"] == 0.0

    def test_num_seeds_below_one_raises(self, problems_yaml):
        with pytest.raises(ValueError, match="num_seeds must be at least 1"):
            orchestrator.run_benchmark(
                problems_yaml, ["highs-default"], years=["2025"], num_seeds=0
            )

    def test_num_seeds_greater_than_one_varies_seed(self, problems_yaml, mocker):
        run_solver_mock = mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=3,
        )
        seeds = [call.kwargs["seed"] for call in run_solver_mock.call_args_list]
        assert seeds == [1, 2, 3]

    def test_single_seed_passes_no_seed_override(self, problems_yaml, mocker):
        # Backward compatibility: the default `num_seeds=1` must not
        # override the configuration's own fixed seed.
        run_solver_mock = mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )
        assert run_solver_mock.call_args.kwargs["seed"] is None

    def test_error_status_stops_further_seeds(self, problems_yaml, tmp_path, mocker):
        error_metrics = {**_FAKE_METRICS, "status": "ER"}
        run_solver_mock = mocker.patch.object(
            orchestrator, "run_solver", return_value=error_metrics
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=3,
        )
        assert run_solver_mock.call_count == 1

    def test_oom_status_stops_further_seeds(self, problems_yaml, tmp_path, mocker):
        # An OOM run reports runtime "N/A"; carrying on used to crash the
        # mean/stddev calculation with a TypeError.
        oom_metrics = {**_FAKE_METRICS, "status": "OOM", "runtime": "N/A"}
        run_solver_mock = mocker.patch.object(
            orchestrator, "run_solver", return_value=oom_metrics
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=3,
        )
        assert run_solver_mock.call_count == 1
        summary = pd.read_csv(
            tmp_path / "results" / "benchmark_results_mean_stddev.csv"
        )
        assert pd.isna(summary.iloc[0]["Runtime Mean (s)"])

    def test_non_numeric_observations_are_left_out_of_the_stats(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator,
            "run_solver",
            side_effect=[
                {**_FAKE_METRICS, "runtime": 1.0, "memory": None},
                {**_FAKE_METRICS, "runtime": 3.0, "memory": 10.0},
            ],
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=2,
        )
        summary = pd.read_csv(
            tmp_path / "results" / "benchmark_results_mean_stddev.csv"
        )
        assert summary.iloc[0]["Runtime Mean (s)"] == 2.0
        assert summary.iloc[0]["Memory Mean (MB)"] == 10.0
        assert summary.iloc[0]["Memory StdDev (MB)"] == 0

    def test_seed_column_records_override_or_configured_seed(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml, ["cbc-default"], years=["2024"], run_id="single"
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["cbc-default"],
            years=["2024"],
            run_id="multi",
            num_seeds=2,
            append=True,
        )
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        seeds = pd.read_csv(tmp_path / "results" / "benchmark_results_seeds.csv")
        # cbc-default fixes randomCbcSeed: 1; the overrides are 1 and 2, and
        # the multi-seed run's combined row carries the last seed
        assert list(results["Seed"]) == [1, 2]
        assert list(seeds["Seed"]) == [1, 2]

    def test_multiple_seeds_write_one_combined_row_to_the_main_results(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator,
            "run_solver",
            side_effect=[
                {**_FAKE_METRICS, "runtime": 1.0, "memory": 10.0, "objective": 1.0},
                {**_FAKE_METRICS, "runtime": 3.0, "memory": 30.0, "objective": 2.0},
            ],
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=2,
        )
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        seeds = pd.read_csv(tmp_path / "results" / "benchmark_results_seeds.csv")
        assert list(seeds["Runtime (s)"]) == [1.0, 3.0]
        assert len(results) == 1
        combined = results.iloc[0]
        assert combined["Runtime (s)"] == 2.0  # mean across seeds
        assert combined["Memory Usage (MB)"] == 20.0
        assert combined["Objective Value"] == 2.0  # the last seed's
        assert combined["Seed"] == 2
        assert combined["Status"] == "ok"

    def test_multi_seed_status_is_the_failing_seeds(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator,
            "run_solver",
            side_effect=[dict(_FAKE_METRICS), {**_FAKE_METRICS, "status": "TO"}],
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            num_seeds=3,
        )
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Status"]) == ["TO"]

    def test_single_seed_writes_no_seeds_file(self, problems_yaml, tmp_path, mocker):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )
        assert not (tmp_path / "results" / "benchmark_results_seeds.csv").exists()

    @pytest.fixture
    def two_problems_yaml(self, tmp_path):
        problem_file = tmp_path / "problem.lp"
        problem_file.write_text("Minimize\nobj: x\n")
        path = tmp_path / "two-problems.yaml"
        path.write_text(
            textwrap.dedent(
                f"""\
                problems:
                  problem-a:
                    Path: {problem_file}
                    Size: S
                    Problem class: LP
                  problem-b:
                    Path: {problem_file}
                    Size: S
                    Problem class: LP
                """
            )
        )
        return path

    def test_runs_every_year_and_solver_on_a_problem_before_the_next(
        self, two_problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            two_problems_yaml,
            ["highs-default", "scip-default"],
            years=["2024", "2025"],
            run_id="test-run",
        )
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Problem"]) == ["problem-a"] * 4 + ["problem-b"] * 4
        for _, runs in results.groupby("Problem"):
            assert set(
                zip(runs["Solver"], runs["Solver Release Year"], strict=True)
            ) == {
                ("highs-default", 2024),
                ("highs-default", 2025),
                ("scip-default", 2024),
                ("scip-default", 2025),
            }

    def test_runs_in_shuffled_order(self, problems_yaml, tmp_path, mocker):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        shuffle_mock = mocker.patch.object(
            orchestrator.random, "shuffle", side_effect=lambda runs: runs.reverse()
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default", "scip-default"],
            years=["2024", "2025"],
            run_id="test-run",
        )
        shuffle_mock.assert_called_once()
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(
            zip(results["Solver"], results["Solver Release Year"], strict=True)
        ) == [
            ("scip-default", 2025),
            ("highs-default", 2025),
            ("scip-default", 2024),
            ("highs-default", 2024),
        ]

    def test_crashing_run_is_reported_after_the_others(
        self, problems_yaml, tmp_path, mocker
    ):
        mocker.patch.object(orchestrator.random, "shuffle")
        mocker.patch.object(
            orchestrator,
            "run_solver",
            side_effect=[Exception("boom"), dict(_FAKE_METRICS)],
        )
        with pytest.raises(
            orchestrator.BenchmarkRunError,
            match=r"1 solver run\(s\) failed: highs-default \(2024\) on tiny-problem",
        ):
            orchestrator.run_benchmark(
                problems_yaml,
                ["highs-default"],
                years=["2024", "2025"],
                run_id="test-run",
            )
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Solver Release Year"]) == [2025]

    def test_failed_run_prints_an_alert(self, problems_yaml, mocker, capsys):
        mocker.patch.object(
            orchestrator, "run_solver", return_value={**_FAKE_METRICS, "status": "ER"}
        )
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )
        alert = [
            line
            for line in capsys.readouterr().out.splitlines()
            if line.startswith("BENCHMARK_ALERT")
        ]
        assert alert == [
            "BENCHMARK_ALERT status=ER problem=tiny-problem solver=highs-default "
            "version=1.12.0 year=2025 run_id=test-run host=h"
        ]

    def test_successful_run_prints_no_alert(self, problems_yaml, mocker, capsys):
        mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        orchestrator.run_benchmark(
            problems_yaml, ["highs-default"], years=["2025"], run_id="test-run"
        )
        assert "BENCHMARK_ALERT" not in capsys.readouterr().out

    def test_reference_benchmark_runs_before_and_after_solves(
        self, problems_yaml, tmp_path, mocker
    ):
        solver_mock = mocker.patch.object(
            orchestrator, "run_solver", return_value=dict(_FAKE_METRICS)
        )
        mocker.patch.object(
            orchestrator, "get_highs_binary_version", return_value="1.9.0"
        )
        reference_mock = mocker.patch.object(
            orchestrator,
            "run_reference_highs_binary",
            return_value={
                "status": "OK",
                "condition": "Optimal",
                "objective": 1.0,
                "runtime": 0.1,
                "memory": "N/A",
                "duality_gap": None,
                "max_integrality_violation": None,
            },
        )
        orchestrator.run_benchmark(
            problems_yaml,
            ["highs-default"],
            years=["2025"],
            run_id="test-run",
            reference_interval=3600,
        )
        # Once before the only solve and once after it, even though the
        # interval hasn't passed in between
        assert reference_mock.call_count == 2
        solver_mock.assert_called_once()
        results = pd.read_csv(tmp_path / "results" / "benchmark_results.csv")
        assert list(results["Problem"]) == [
            "reference-benchmark",
            "tiny-problem",
            "reference-benchmark",
        ]


class TestGetGceMetadata:
    def _patch_get(self, mocker, **response):
        return mocker.patch.object(
            orchestrator.requests,
            "get",
            return_value=SimpleNamespace(
                status_code=response.get("status_code", 200),
                headers=response.get("headers", {}),
                text=response.get("text", ""),
            ),
        )

    def test_reads_the_value_from_the_metadata_server(self, mocker):
        get = self._patch_get(
            mocker,
            headers={"Metadata-Flavor": "Google"},
            text="projects/319823961160/machineTypes/c4-highmem-8",
        )
        assert orchestrator._get_gce_metadata("machine-type") == "c4-highmem-8"
        assert get.call_args.kwargs["timeout"] > 0

    def test_html_page_off_gce_is_unknown(self, mocker):
        # Regression test for #477: off GCE, a proxy answered with an HTML
        # page and "html>\n" ended up in the results CSV.
        self._patch_get(
            mocker,
            headers={"Content-Type": "text/html"},
            text="<!DOCTYPE html>\n<html>\n...\n</html>\n",
        )
        assert orchestrator._get_gce_metadata("zone") == "unknown"

    def test_error_status_is_unknown(self, mocker):
        self._patch_get(mocker, status_code=404, headers={"Metadata-Flavor": "Google"})
        assert orchestrator._get_gce_metadata("zone") == "unknown"

    def test_unreachable_server_is_unknown(self, mocker):
        mocker.patch.object(
            orchestrator.requests,
            "get",
            side_effect=orchestrator.requests.ConnectionError("no route"),
        )
        assert orchestrator._get_gce_metadata("zone") == "unknown"

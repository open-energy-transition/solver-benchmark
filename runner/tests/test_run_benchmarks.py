"""Characterization tests for runner/run_benchmarks.py, as it exists today.

These tests lock in current behavior ahead of the runner/utils.py module
split (issue #478); they are not meant to validate design.
"""

import csv
import gzip
import subprocess
from unittest.mock import MagicMock

import pytest
import run_benchmarks
from run_benchmarks import (
    csv_record,
    download_benchmark_file,
    get_conda_package_versions,
    parse_memory,
    write_csv_headers,
    write_csv_row,
)


class TestCsvRecord:
    def test_maps_kwargs_to_named_columns(self):
        record = csv_record(
            check=False,
            benchmark_name="bench-a",
            size="S",
            solver="highs",
            status="ok",
        )
        assert record["Benchmark"] == "bench-a"
        assert record["Size"] == "S"
        assert record["Solver"] == "highs"
        assert record["Status"] == "ok"

    def test_missing_kwargs_default_to_none(self):
        record = csv_record(check=False)
        assert all(v is None for v in record.values())

    def test_check_true_raises_on_missing_fields(self):
        with pytest.raises(ValueError, match="Missing attributes"):
            csv_record(check=True, benchmark_name="bench-a")

    def test_check_true_passes_when_all_fields_present(self):
        full_kwargs = {
            "benchmark_name": "b",
            "size": "S",
            "solver": "highs",
            "solver_version": "1.9.0",
            "solver_release_year": 2024,
            "status": "ok",
            "condition": "optimal",
            "runtime": 1.0,
            "memory": 10.0,
            "objective": 1.0,
            "max_integrality_violation": 0.0,
            "duality_gap": 0.0,
            "reported_runtime": 1.0,
            "timeout": 3600,
            "hostname": "h",
            "run_id": "r",
            "timestamp": "t",
            "vm_instance_type": "vm",
            "vm_zone": "z",
            "solver_benchmark_version": "abc123",
        }
        record = csv_record(check=True, **full_kwargs)
        assert record["Benchmark"] == "b"

    def test_column_order_is_stable(self):
        record = csv_record(check=False)
        assert list(record.keys()) == [
            "Benchmark",
            "Size",
            "Solver",
            "Solver Version",
            "Solver Release Year",
            "Status",
            "Termination Condition",
            "Runtime (s)",
            "Memory Usage (MB)",
            "Objective Value",
            "Max Integrality Violation",
            "Duality Gap",
            "Reported Runtime (s)",
            "Timeout",
            "Hostname",
            "Run ID",
            "Timestamp",
            "VM Instance Type",
            "VM Zone",
            "Solver benchmark version",
        ]


class TestCsvRoundTrip:
    def test_write_headers_and_row_round_trip(self, tmp_path):
        results_csv = tmp_path / "results.csv"
        mean_stddev_csv = tmp_path / "mean_stddev.csv"
        write_csv_headers(results_csv, mean_stddev_csv)

        metrics = {
            "size": "S",
            "solver": "highs",
            "solver_version": "1.9.0",
            "solver_release_year": 2024,
            "status": "ok",
            "condition": "optimal",
            "runtime": 1.5,
            "memory": 12.3,
            "objective": 42.0,
            "max_integrality_violation": None,
            "duality_gap": None,
            "reported_runtime": 1.4,
            "timeout": 3600,
        }
        write_csv_row(
            results_csv,
            benchmark_name="bench-a",
            metrics=metrics,
            run_id="run-1",
            timestamp="2024-01-01 00:00:00",
            vm_instance_type="c4-standard-2",
            vm_zone="us-central1-a",
            hostname="host-1",
            solver_benchmark_version="abc123",
        )

        with open(results_csv, newline="") as f:
            rows = list(csv.reader(f))

        assert rows[0] == list(csv_record(check=False).keys())
        assert rows[1][0] == "bench-a"  # Benchmark
        assert rows[1][1] == "S"  # Size
        assert rows[1][2] == "highs"  # Solver
        assert rows[1][5] == "ok"  # Status
        assert rows[1][7] == "1.5"  # Runtime (s)
        assert rows[1][16] == "2024-01-01 00:00:00"  # Timestamp

    def test_mean_stddev_headers_written(self, tmp_path):
        results_csv = tmp_path / "results.csv"
        mean_stddev_csv = tmp_path / "mean_stddev.csv"
        write_csv_headers(results_csv, mean_stddev_csv)
        with open(mean_stddev_csv, newline="") as f:
            rows = list(csv.reader(f))
        assert rows[0] == [
            "Benchmark",
            "Size",
            "Solver",
            "Solver Version",
            "Solver Release Year",
            "Status",
            "Termination Condition",
            "Runtime Mean (s)",
            "Runtime StdDev (s)",
            "Memory Mean (MB)",
            "Memory StdDev (MB)",
            "Objective Value",
            "Run ID",
            "Timestamp",
        ]


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


class TestGetCondaPackageVersions:
    def test_parses_package_versions(self, mocker):
        stdout = (
            "# packages in environment:\n"
            "#\n"
            "\n"
            "highspy                  1.9.0                    pypi\n"
            "coin-or-cbc               2.10.5                   h123\n"
        )
        mocker.patch(
            "run_benchmarks.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=["conda", "list"], returncode=0, stdout=stdout, stderr=""
            ),
        )
        result = get_conda_package_versions(["highs", "cbc", "unknown-solver"])
        assert result == {
            "highs": "1.9.0",
            "cbc": "2.10.5",
            "unknown-solver": None,
        }

    def test_passes_env_name_to_conda_list(self, mocker):
        run_mock = mocker.patch(
            "run_benchmarks.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout="", stderr=""
            ),
        )
        get_conda_package_versions(["highs"], env_name="benchmark-highs-2025")
        called_cmd = run_mock.call_args[0][0]
        assert called_cmd == ["bash", "-i", "-c", "conda list -n benchmark-highs-2025"]

    def test_called_process_error_raises_value_error(self, mocker):
        mocker.patch(
            "run_benchmarks.subprocess.run",
            side_effect=subprocess.CalledProcessError(1, "conda list", stderr="boom"),
        )
        with pytest.raises(ValueError, match="boom"):
            get_conda_package_versions(["highs"])


class TestDownloadBenchmarkFile:
    def test_skips_download_if_file_exists(self, tmp_path, mocker):
        dest = tmp_path / "bench.lp"
        dest.write_text("already here")
        requests_mock = mocker.patch("run_benchmarks.requests.get")
        subprocess_mock = mocker.patch("run_benchmarks.subprocess.run")

        download_benchmark_file("http://example.com/bench.lp", dest)

        requests_mock.assert_not_called()
        subprocess_mock.assert_not_called()
        assert dest.read_text() == "already here"

    def test_http_download_streams_to_file(self, tmp_path, mocker):
        dest = tmp_path / "bench.lp"
        response = MagicMock()
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        response.iter_content.return_value = [b"hello ", b"world"]
        mocker.patch("run_benchmarks.requests.get", return_value=response)

        download_benchmark_file("http://example.com/bench.lp", dest)

        assert dest.read_bytes() == b"hello world"
        response.raise_for_status.assert_called_once()

    def test_gcs_download_uses_gsutil(self, tmp_path, mocker):
        dest = tmp_path / "bench.lp"
        run_mock = mocker.patch(
            "run_benchmarks.subprocess.run",
            return_value=subprocess.CompletedProcess(args=[], returncode=0),
        )

        download_benchmark_file("gs://solver-benchmarks/bench.lp", dest)

        called_cmd = run_mock.call_args[0][0]
        assert called_cmd == ["gsutil", "cp", "gs://solver-benchmarks/bench.lp", dest]

    def test_gz_download_is_unzipped_and_original_removed(self, tmp_path, mocker):
        dest = tmp_path / "bench.lp.gz"
        uncompressed_content = b"lp file contents"
        gz_bytes = gzip.compress(uncompressed_content)

        response = MagicMock()
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        response.iter_content.return_value = [gz_bytes]
        mocker.patch("run_benchmarks.requests.get", return_value=response)

        download_benchmark_file("http://example.com/bench.lp.gz", dest)

        uncompressed_dest = dest.with_suffix("")
        assert uncompressed_dest.read_bytes() == uncompressed_content
        assert not dest.exists()


class TestBenchmarkSolver:
    def _run(self, mocker, completed_process, stderr_has_memory_line=True):
        mocker.patch("run_benchmarks._systemd_available", return_value=False)
        mocker.patch("run_benchmarks.subprocess.run", return_value=completed_process)
        return run_benchmarks.benchmark_solver(
            "bench.lp", "highs", timeout=3600, solver_version="1.9.0"
        )

    def test_timeout_returncode_124(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        metrics = self._run(mocker, cp)
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
        metrics = self._run(mocker, cp)
        assert metrics["status"] == "OOM"
        assert metrics["condition"] == "Out of Memory"
        assert metrics["runtime"] == "N/A"

    def test_other_nonzero_returncode_is_error(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[], returncode=1, stdout="", stderr="MaxResidentSetSizeKB=1000"
        )
        metrics = self._run(mocker, cp)
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
        metrics = self._run(mocker, cp)
        assert metrics["status"] == "ok"
        assert metrics["objective"] == 1.0
        assert metrics["memory"] == pytest.approx(2.048)

    def test_memory_none_when_unparseable(self, mocker):
        cp = subprocess.CompletedProcess(
            args=[],
            returncode=124,
            stdout="",
            stderr="no memory info here",
        )
        metrics = self._run(mocker, cp)
        assert metrics["memory"] is None

    @pytest.mark.xfail(
        strict=True,
        reason=(
            "Known bug: parse_memory() does output.splitlines()[-1] with no "
            "guard for empty output, and benchmark_solver only catches "
            "ValueError around that call, so a completely empty stderr (e.g. "
            "/usr/bin/time never got to run) crashes with an uncaught "
            "IndexError instead of leaving memory=None. Remove this xfail "
            "once that's fixed."
        ),
    )
    def test_empty_stderr_leaves_memory_none(self, mocker):
        cp = subprocess.CompletedProcess(args=[], returncode=124, stdout="", stderr="")
        metrics = self._run(mocker, cp)
        assert metrics["memory"] is None

    def test_env_name_uses_conda_run(self, mocker):
        mocker.patch("run_benchmarks._systemd_available", return_value=False)
        run_mock = mocker.patch(
            "run_benchmarks.subprocess.run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=124, stdout="", stderr="MaxResidentSetSizeKB=1000"
            ),
        )
        run_benchmarks.benchmark_solver(
            "bench.lp",
            "highs",
            timeout=3600,
            solver_version="1.9.0",
            env_name="benchmark-highs-2025",
        )
        called_cmd = run_mock.call_args[0][0]
        assert "conda" in called_cmd
        assert "run" in called_cmd
        assert "benchmark-highs-2025" in called_cmd

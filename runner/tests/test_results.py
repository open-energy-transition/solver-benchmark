"""Tests for runner/utils/results.py: the benchmark-results CSV schema."""

import csv

import pytest

from runner.utils.results import (
    csv_record,
    write_csv_headers,
    write_csv_row,
    write_csv_summary_row,
)


class TestCsvRecord:
    def test_maps_kwargs_to_named_columns(self):
        record = csv_record(
            check=False,
            problem_id="problem-a",
            solver="highs",
            status="ok",
        )
        assert record["Problem"] == "problem-a"
        assert record["Solver"] == "highs"
        assert record["Status"] == "ok"

    def test_has_no_size_column(self):
        # "Size" held the specific instance name within a multi-instance
        # problem family; every problem is its own row since #481, so
        # nothing is left to disambiguate -- see results.py's module
        # docstring.
        assert "Size" not in csv_record(check=False)

    def test_missing_kwargs_default_to_none(self):
        record = csv_record(check=False)
        assert all(v is None for v in record.values())

    def test_check_true_raises_on_missing_fields(self):
        with pytest.raises(ValueError, match="Missing attributes"):
            csv_record(check=True, problem_id="problem-a")

    def test_check_true_passes_when_all_fields_present(self):
        full_kwargs = {
            "problem_id": "p",
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
        assert record["Problem"] == "p"

    def test_column_order_is_stable(self):
        record = csv_record(check=False)
        assert list(record.keys()) == [
            "Problem",
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
            problem_id="problem-a",
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
        assert rows[1][0] == "problem-a"  # Problem
        assert rows[1][1] == "highs"  # Solver
        assert rows[1][4] == "ok"  # Status
        assert rows[1][6] == "1.5"  # Runtime (s)
        assert rows[1][15] == "2024-01-01 00:00:00"  # Timestamp

    def test_mean_stddev_headers_have_no_size_column(self, tmp_path):
        results_csv = tmp_path / "results.csv"
        mean_stddev_csv = tmp_path / "mean_stddev.csv"
        write_csv_headers(results_csv, mean_stddev_csv)
        with open(mean_stddev_csv, newline="") as f:
            rows = list(csv.reader(f))
        assert rows[0] == [
            "Problem",
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

    def test_write_csv_summary_row(self, tmp_path):
        results_csv = tmp_path / "results.csv"
        mean_stddev_csv = tmp_path / "mean_stddev.csv"
        write_csv_headers(results_csv, mean_stddev_csv)

        metrics = {
            "solver": "highs",
            "solver_version": "1.9.0",
            "solver_release_year": 2024,
            "status": "ok",
            "condition": "optimal",
            "runtime_mean": 1.5,
            "runtime_stddev": 0.1,
            "memory_mean": 12.3,
            "memory_stddev": 0.5,
            "objective": 42.0,
        }
        write_csv_summary_row(
            mean_stddev_csv, "problem-a", metrics, "run-1", "2024-01-01 00:00:00"
        )

        with open(mean_stddev_csv, newline="") as f:
            rows = list(csv.reader(f))
        assert rows[1][0] == "problem-a"
        assert rows[1][6] == "1.5"  # Runtime Mean (s)

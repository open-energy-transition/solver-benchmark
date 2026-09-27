"""Tests for runner/utils/analyze.py: loading benchmark results and
computing summary statistics over them.
"""

import numpy as np
import pandas as pd
import pytest

from runner.utils.analyze import (
    calculate_sgm,
    compute_summary_results,
    is_solved,
    load_results,
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
        assert row["Solved Problems"] == " 50% (1/2)"

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


class TestLoadResults:
    def _write_csv(self, tmp_path, name, rows):
        # Columns come from the rows themselves (not a fixed shared list),
        # matching real files: old-format CSVs only ever have
        # "Benchmark"/"Size" and new-format ones only ever have "Problem" --
        # never both at once.
        path = tmp_path / name
        pd.DataFrame(rows).to_csv(path, index=False)
        return path

    def test_new_format_rows_use_problem_column_as_is(self, tmp_path):
        self._write_csv(
            tmp_path,
            "results.csv",
            [
                {
                    "Problem": "pypsa-eur-elec-op-2-1h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                }
            ],
        )
        results, _ = load_results(str(tmp_path))
        assert list(results["Problem"]) == ["pypsa-eur-elec-op-2-1h"]
        assert "Benchmark" not in results.columns

    def test_old_format_rows_fold_benchmark_and_size_into_problem(self, tmp_path):
        # Historical CSVs identified a row by "Benchmark" (a model family
        # name) plus "Size" (the specific instance within it, e.g. a
        # resolution like "100-12h") -- see the real historical
        # results/benchmark_results.csv for this exact pattern with
        # pypsa-eur-elec.
        self._write_csv(
            tmp_path,
            "results.csv",
            [
                {
                    "Benchmark": "pypsa-eur-elec",
                    "Size": "100-12h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                }
            ],
        )
        results, _ = load_results(str(tmp_path))
        assert list(results["Problem"]) == ["pypsa-eur-elec-100-12h"]
        assert "Benchmark" not in results.columns

    def test_mixed_old_and_new_format_rows_both_get_unique_problem(self, tmp_path):
        self._write_csv(
            tmp_path,
            "old.csv",
            [
                {
                    "Benchmark": "pypsa-eur-elec",
                    "Size": "50-168h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                }
            ],
        )
        self._write_csv(
            tmp_path,
            "new.csv",
            [
                {
                    "Problem": "pypsa-eur-elec-op-2-1h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20250101-r2",
                    "VM Zone": "us-central1-a",
                }
            ],
        )
        results, _ = load_results(str(tmp_path))
        assert set(results["Problem"]) == {
            "pypsa-eur-elec-50-168h",
            "pypsa-eur-elec-op-2-1h",
        }

    def test_reference_benchmark_rows_are_excluded_from_results(self, tmp_path):
        self._write_csv(
            tmp_path,
            "results.csv",
            [
                {
                    "Problem": "reference-benchmark",
                    "Solver": "highs-binary",
                    "Solver Version": "1.9.0",
                    "Status": "OK",
                    "Runtime (s)": 0.5,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                },
                {
                    "Problem": "pypsa-eur-elec-op-2-1h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                },
            ],
        )
        results, variability = load_results(str(tmp_path))
        assert list(results["Problem"]) == ["pypsa-eur-elec-op-2-1h"]
        assert len(variability) == 1

    def test_only_latest_run_kept_per_problem(self, tmp_path):
        self._write_csv(
            tmp_path,
            "results.csv",
            [
                {
                    "Problem": "pypsa-eur-elec-op-2-1h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 1.0,
                    "Hostname": "h",
                    "Run ID": "20240101-r1",
                    "VM Zone": "us-central1-a",
                },
                {
                    "Problem": "pypsa-eur-elec-op-2-1h",
                    "Solver": "highs",
                    "Solver Version": "1.9.0",
                    "Status": "ok",
                    "Runtime (s)": 2.0,
                    "Hostname": "h",
                    "Run ID": "20250101-r2",
                    "VM Zone": "us-central1-a",
                },
            ],
        )
        results, _ = load_results(str(tmp_path))
        assert len(results) == 1
        assert results.iloc[0]["Run ID"] == "20250101-r2"

"""Tests for runner/utils/solver.py: solver dispatch and result-metric
accessors that delegate to `runner/utils/solvers/`'s per-solver adapters.
"""

from unittest.mock import MagicMock

import pandas as pd
import pytest

from runner.utils.solver import (
    calculate_integrality_violation,
    get_duality_gap,
    get_reported_runtime,
    get_solver,
    is_mip_problem,
)


class TestGetSolver:
    def _patch_solver_class(self, monkeypatch, attr_name):
        captured = {}
        fake_class = MagicMock(
            side_effect=lambda options: captured.setdefault("options", options)
        )
        monkeypatch.setattr(f"runner.utils.solver.solvers.{attr_name}", fake_class)
        return captured

    def test_plain_configuration_uses_its_own_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        _, resolved_name = get_solver("highs")
        assert resolved_name == "highs"
        assert captured["options"]["random_seed"] == 4
        assert captured["options"]["mip_rel_gap"] == pytest.approx(1e-4)

    def test_named_configuration_resolves_to_its_solver(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        _, resolved_name = get_solver("highs-hipo")
        assert resolved_name == "highs"
        assert captured["options"]["solver"] == "hipo"
        assert captured["options"]["hipo_block_size"] == 64

    def test_unregistered_name_falls_back_to_bare_solver_with_no_options(
        self, monkeypatch
    ):
        captured = self._patch_solver_class(monkeypatch, "Mosek")
        _, resolved_name = get_solver("mosek")
        assert resolved_name == "mosek"
        assert captured["options"]["MSK_IPAR_MIO_SEED"] == 4

    def test_unsupported_solver_name_raises(self):
        with pytest.raises(ValueError):
            get_solver("not-a-solver")


class TestIsMipProblem:
    def test_none_model_is_false(self):
        assert is_mip_problem(None, "highs") is False

    def test_delegates_to_the_solvers_adapter(self):
        model = MagicMock()
        model.getNIntVars.return_value = 1
        model.getNBinVars.return_value = 0
        assert is_mip_problem(model, "scip") is True

    def test_unregistered_solver_raises(self):
        with pytest.raises(NotImplementedError):
            is_mip_problem(MagicMock(), "not-a-solver")


class TestGetDualityGap:
    def test_none_model_returns_none(self):
        assert get_duality_gap(None, "highs") is None

    def test_delegates_to_the_solvers_adapter(self):
        model = MagicMock()
        model.getGap.return_value = 0.01
        assert get_duality_gap(model, "scip") == 0.01

    def test_unregistered_solver_raises(self):
        with pytest.raises(NotImplementedError):
            get_duality_gap(MagicMock(), "not-a-solver")


class TestGetReportedRuntime:
    def test_none_model_returns_none(self):
        assert get_reported_runtime("highs", None) is None

    def test_delegates_to_the_solvers_adapter(self):
        model = MagicMock()
        model.getRunTime.return_value = 1.23
        assert get_reported_runtime("highs", model) == 1.23

    def test_unregistered_solver_returns_none_with_warning(self, capsys):
        assert get_reported_runtime("not-a-solver", MagicMock()) is None
        assert "WARNING" in capsys.readouterr().out

    def test_exception_is_caught_and_returns_none(self):
        model = MagicMock()
        model.getRunTime.side_effect = RuntimeError("boom")
        assert get_reported_runtime("highs", model) is None


class TestCalculateIntegralityViolation:
    def test_basic_violation(self):
        integer_vars = pd.Index(["x", "y"])
        primal_values = pd.Series({"x": 1.4, "y": 2.0, "z": 3.9})
        # max |p - round(p)| over integer_vars only: |1.4-1|=0.4, |2.0-2|=0.0
        assert calculate_integrality_violation(
            integer_vars, primal_values
        ) == pytest.approx(0.4)

    def test_ignores_non_integer_vars(self):
        integer_vars = pd.Index(["x"])
        primal_values = pd.Series({"x": 1.0, "z": 3.9})
        assert calculate_integrality_violation(
            integer_vars, primal_values
        ) == pytest.approx(0.0)

    def test_zero_when_all_integral(self):
        integer_vars = pd.Index(["x", "y"])
        primal_values = pd.Series({"x": 1.0, "y": 2.0})
        assert calculate_integrality_violation(integer_vars, primal_values) == 0.0

"""Tests for runner/utils/solver.py: solver dispatch and result-metric
accessors that delegate to `runner/utils/solvers/`'s per-solver adapters.
"""

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from runner.utils.solver import (
    calculate_integrality_violation,
    get_duality_gap,
    get_milp_metrics,
    get_reported_runtime,
    get_solver,
    is_mip_problem,
    main,
)
from runner.utils.solvers import SOLVER_ADAPTERS


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
        _, solver_package = get_solver("highs-default")
        assert solver_package == "highs"
        assert captured["options"]["random_seed"] == 0
        assert captured["options"]["mip_rel_gap"] == pytest.approx(1e-4)

    def test_named_configuration_resolves_to_its_solver(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        _, solver_package = get_solver("highs-hipo")
        assert solver_package == "highs"
        assert captured["options"]["solver"] == "hipo"
        assert captured["options"]["hipo_block_size"] == 64

    def test_unregistered_name_falls_back_to_bare_solver_with_no_options(
        self, monkeypatch
    ):
        captured = self._patch_solver_class(monkeypatch, "Mosek")
        _, solver_package = get_solver("mosek-default")
        assert solver_package == "mosek"
        assert captured["options"]["MSK_IPAR_MIO_SEED"] == 0

    def test_unsupported_solver_name_raises(self):
        with pytest.raises(ValueError, match="not a valid SolverName"):
            get_solver("not-a-solver")

    def test_seed_overrides_configurations_own_seed(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs-default", seed=42)
        assert captured["options"]["random_seed"] == 42
        # Other options are untouched
        assert captured["options"]["mip_rel_gap"] == pytest.approx(1e-4)

    def test_no_seed_keeps_configurations_own_seed(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs-default", seed=None)
        assert captured["options"]["random_seed"] == 0

    def test_seed_ignored_with_warning_when_no_seed_options_entry(
        self, monkeypatch, capsys
    ):
        monkeypatch.setattr(
            "runner.utils.solver.config.get_seed_option", lambda *_a, **_k: None
        )
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs-default", seed=42)
        assert captured["options"]["random_seed"] == 0
        assert "no seed_options entry" in capsys.readouterr().err


class TestIsMipProblem:
    def test_none_model_is_unknown(self):
        assert is_mip_problem(None, "highs") is None

    def test_delegates_to_the_solvers_adapter(self):
        var = MagicMock()
        var.vtype.return_value = "INTEGER"
        model = MagicMock()
        model.getVars.return_value = [var]
        assert is_mip_problem(model, "scip") is True

    def test_unregistered_solver_raises(self):
        with pytest.raises(NotImplementedError):
            is_mip_problem(MagicMock(), "not-a-solver")


class TestGetDualityGap:
    def test_none_model_returns_none(self):
        assert get_duality_gap(None, "highs", Path("p.log")) is None

    def test_delegates_to_the_solvers_adapter(self):
        model = MagicMock()
        model.getGap.return_value = 0.01
        assert get_duality_gap(model, "scip", Path("p.log")) == 0.01

    def test_unregistered_solver_raises(self):
        with pytest.raises(NotImplementedError):
            get_duality_gap(MagicMock(), "not-a-solver", Path("p.log"))


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
        # max |v - round(v)|: |1.4 - 1| = 0.4, |2.0 - 2| = 0.0
        assert calculate_integrality_violation({"x": 1.4, "y": 2.0}) == pytest.approx(
            0.4
        )

    def test_zero_when_all_integral(self):
        assert calculate_integrality_violation({"x": 1.0, "y": 2.0}) == 0.0


class TestGetMilpMetrics:
    def _patch_adapter(self, monkeypatch, integer_values, duality_gap=0.01):
        adapter = MagicMock()
        adapter.integer_values.return_value = integer_values
        adapter.duality_gap.return_value = duality_gap
        monkeypatch.setitem(SOLVER_ADAPTERS, "fake", adapter)
        return adapter

    def test_uses_the_adapters_integer_values(self, monkeypatch):
        adapter = self._patch_adapter(monkeypatch, {"x": 1.4, "y": 2.0})
        assert get_milp_metrics(
            MagicMock(), "fake", Path("p.lp"), Path("p.sol"), Path("p.log"), True
        ) == (0.01, pytest.approx(0.4))
        adapter.integer_values.assert_called_once()

    def test_no_integer_vars_returns_none(self, monkeypatch):
        self._patch_adapter(monkeypatch, {})
        assert get_milp_metrics(
            MagicMock(), "fake", Path("p.lp"), Path("p.sol"), Path("p.log"), True
        ) == (None, None)

    def test_unreadable_values_keep_the_gap_but_not_the_violation(self, monkeypatch):
        self._patch_adapter(monkeypatch, None)
        assert get_milp_metrics(
            MagicMock(), "fake", Path("p.lp"), Path("p.sol"), Path("p.log"), True
        ) == (0.01, None)

    def test_unknown_mip_status_and_unreadable_values_returns_none(self, monkeypatch):
        self._patch_adapter(monkeypatch, None)
        assert get_milp_metrics(
            MagicMock(), "fake", Path("p.lp"), Path("p.sol"), Path("p.log"), None
        ) == (None, None)

    def test_adapter_exception_is_caught(self, monkeypatch):
        adapter = self._patch_adapter(monkeypatch, None)
        adapter.integer_values.side_effect = RuntimeError("boom")
        assert get_milp_metrics(
            MagicMock(), "fake", Path("p.lp"), Path("p.sol"), Path("p.log"), True
        ) == (0.01, None)

    def test_unregistered_solver_raises(self):
        with pytest.raises(NotImplementedError):
            get_milp_metrics(
                MagicMock(),
                "not-a-solver",
                Path("p.lp"),
                Path("p.sol"),
                Path("p.log"),
                True,
            )


class TestMainRecoversFromLinopyParseFailures:
    def _run(self, monkeypatch, capsys, recovered):
        solver = MagicMock()
        solver.solve_problem.side_effect = KeyError("Row name")
        monkeypatch.setattr(
            "runner.utils.solver.get_solver", lambda *a, **k: (solver, "fake")
        )
        adapter = MagicMock()
        adapter.recover_result.return_value = recovered
        adapter.is_mip.return_value = None
        adapter.integer_values.return_value = {"x": 1.0}
        adapter.duality_gap.return_value = None
        monkeypatch.setitem(SOLVER_ADAPTERS, "fake", adapter)
        main("fake-default", "problem.lp", "1.0")
        return json.loads(capsys.readouterr().out.strip().splitlines()[-1])

    def test_uses_the_adapters_result_when_linopy_fails(self, monkeypatch, capsys):
        results = self._run(
            monkeypatch,
            capsys,
            {"status": "ok", "condition": "optimal", "objective": 3.7},
        )
        assert results["status"] == "ok"
        assert results["objective"] == 3.7
        assert results["runtime"] is not None
        assert results["max_integrality_violation"] == 0.0

    def test_still_errors_without_a_recovered_result(self, monkeypatch, capsys):
        results = self._run(monkeypatch, capsys, None)
        assert results["status"] == "ER"

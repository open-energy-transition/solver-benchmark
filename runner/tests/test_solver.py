"""Tests for runner/utils/solver.py: solver dispatch and result-metric
accessors that delegate to `runner/utils/solvers/`'s per-solver adapters.
"""

from unittest.mock import MagicMock

import numpy as np
import pytest

from runner.utils.solver import (
    calculate_integrality_violation,
    get_duality_gap,
    get_milp_metrics,
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
        _, solver_package = get_solver("highs-default")
        assert solver_package == "highs"
        assert captured["options"]["random_seed"] == 4
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
        assert captured["options"]["MSK_IPAR_MIO_SEED"] == 4

    def test_unsupported_solver_name_raises(self):
        with pytest.raises(ValueError):
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
        assert captured["options"]["random_seed"] == 4

    def test_seed_ignored_with_warning_when_no_seed_options_entry(
        self, monkeypatch, capsys
    ):
        monkeypatch.setattr(
            "runner.utils.solver.config.get_seed_option", lambda *_a, **_k: None
        )
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs-default", seed=42)
        assert captured["options"]["random_seed"] == 4
        assert "no seed_options entry" in capsys.readouterr().err


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
        # primal_values is label-indexed (see solver.py's module docstring
        # on linopy's Solution.primal): label 2 ("z") isn't an integer var
        # and is excluded via integer_var_labels, not via a name lookup.
        integer_var_labels = np.array([0, 1])
        primal_values = np.array([1.4, 2.0, 3.9])
        # max |p - round(p)| over integer_var_labels only: |1.4-1|=0.4, |2.0-2|=0.0
        assert calculate_integrality_violation(
            integer_var_labels, primal_values
        ) == pytest.approx(0.4)

    def test_ignores_non_integer_vars(self):
        integer_var_labels = np.array([0])
        primal_values = np.array([1.0, 3.9])
        assert calculate_integrality_violation(
            integer_var_labels, primal_values
        ) == pytest.approx(0.0)

    def test_zero_when_all_integral(self):
        integer_var_labels = np.array([0, 1])
        primal_values = np.array([1.0, 2.0])
        assert calculate_integrality_violation(integer_var_labels, primal_values) == 0.0

    def test_none_when_primal_values_is_empty(self):
        # Regression test: linopy's deprecated file-based solve path
        # (Solver.solve_problem) never initializes its internal variable
        # count, so it always returns a zero-length Solution.primal
        # regardless of the problem's real size -- confirmed against a real
        # MILP solve, not just a hypothetical.
        integer_var_labels = np.array([1, 2])
        primal_values = np.array([])
        assert (
            calculate_integrality_violation(integer_var_labels, primal_values) is None
        )

    def test_none_when_no_label_is_in_bounds(self):
        integer_var_labels = np.array([5, 6])
        primal_values = np.array([1.0, 2.0])
        assert (
            calculate_integrality_violation(integer_var_labels, primal_values) is None
        )

    def test_out_of_range_labels_are_dropped_not_raised(self):
        # A partially-populated primal (some in bounds, some not) still
        # computes the violation over whatever labels it can.
        integer_var_labels = np.array([0, 5])
        primal_values = np.array([1.4])
        assert calculate_integrality_violation(
            integer_var_labels, primal_values
        ) == pytest.approx(0.4)


class TestGetMilpMetrics:
    def test_maps_solver_variable_names_to_linopy_labels(self, monkeypatch):
        # Regression test: since linopy 0.9, Solution.primal is a dense
        # array indexed by linopy's own integer "label" per variable (parsed
        # from each variable's "x<label>" name), not a pandas Series indexed
        # by variable name -- get_milp_metrics must convert highspy's
        # reported names into labels before indexing into primal, instead of
        # trying `.loc` on what is no longer a labeled Series.
        integrality = {
            0: (None, "integer"),
            1: (None, "integer"),
            2: (None, "continuous"),
        }
        fake_h = MagicMock()
        fake_h.numVariables = 3
        fake_h.variableName.side_effect = lambda i: f"x{i}"
        fake_h.getColIntegrality.side_effect = lambda i: integrality[i]

        fake_highspy = MagicMock()
        fake_highspy.HighsVarType.kInteger = "integer"
        fake_highspy.Highs.return_value = fake_h
        monkeypatch.setattr("runner.utils.solver.highspy", fake_highspy)

        solver_result = MagicMock()
        solver_result.solver_model = MagicMock()
        # label 0 ("x0") -> 1.4, label 1 ("x1") -> 2.0, label 2 (non-integer,
        # excluded) -> 3.9
        solver_result.solution.primal = np.array([1.4, 2.0, 3.9])

        _, max_violation = get_milp_metrics("problem.lp", solver_result, "highs")
        assert max_violation == pytest.approx(0.4)

    def test_no_integer_vars_returns_none(self, monkeypatch):
        fake_h = MagicMock()
        fake_h.numVariables = 2
        fake_h.variableName.side_effect = lambda i: f"x{i}"
        fake_h.getColIntegrality.return_value = (None, "continuous")

        fake_highspy = MagicMock()
        fake_highspy.HighsVarType.kInteger = "integer"
        fake_highspy.Highs.return_value = fake_h
        monkeypatch.setattr("runner.utils.solver.highspy", fake_highspy)

        solver_result = MagicMock()
        solver_result.solver_model = MagicMock()
        solver_result.solution.primal = np.array([1.4, 2.0])

        duality_gap, max_violation = get_milp_metrics(
            "problem.lp", solver_result, "highs"
        )
        assert (duality_gap, max_violation) == (None, None)

    def test_highspy_unavailable_returns_none(self, monkeypatch):
        monkeypatch.setattr("runner.utils.solver.highspy", None)
        solver_result = MagicMock()
        solver_result.solver_model = MagicMock()
        assert get_milp_metrics("problem.lp", solver_result, "highs") == (None, None)

    def test_empty_primal_from_deprecated_solve_path_does_not_raise(self, monkeypatch):
        # Regression test for a real bug found running an actual MILP
        # (tests/sample_benchmarks/sample_mip.lp) through the real CLI:
        # linopy's deprecated file-based solve path always returns a
        # zero-length Solution.primal (see calculate_integrality_violation's
        # docstring), which used to raise an uncaught IndexError here.
        integrality = {0: (None, "continuous"), 1: (None, "integer")}
        fake_h = MagicMock()
        fake_h.numVariables = 2
        fake_h.variableName.side_effect = lambda i: f"x{i}"
        fake_h.getColIntegrality.side_effect = lambda i: integrality[i]

        fake_highspy = MagicMock()
        fake_highspy.HighsVarType.kInteger = "integer"
        fake_highspy.Highs.return_value = fake_h
        monkeypatch.setattr("runner.utils.solver.highspy", fake_highspy)

        solver_result = MagicMock()
        solver_result.solver_model = MagicMock()
        solver_result.solution.primal = np.array([])

        _, max_violation = get_milp_metrics("problem.lp", solver_result, "highs")
        assert max_violation is None

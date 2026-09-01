"""Characterization tests for runner/run_solver.py, as it exists today.

These tests lock in current behavior ahead of the runner/utils.py module
split (issue #478); they are not meant to validate design.
"""

from unittest.mock import MagicMock

import pandas as pd
import pytest
from run_solver import (
    HighsVariant,
    calculate_integrality_violation,
    get_duality_gap,
    get_reported_runtime,
    get_solver,
    is_mip_problem,
)


class TestHighsVariant:
    def test_hipo_options(self):
        opts = HighsVariant.HIPO.options()
        assert opts["solver"] == "hipo"
        assert opts["hipo_block_size"] == 64
        assert opts["run_crossover"] == "choose"
        assert opts["random_seed"] == 0
        assert opts["mip_rel_gap"] == 1e-4

    @pytest.mark.parametrize(
        "variant,block_size",
        [
            (HighsVariant.HIPO_32, 32),
            (HighsVariant.HIPO_64, 64),
            (HighsVariant.HIPO_128, 128),
        ],
    )
    def test_hipo_block_size_variants(self, variant, block_size):
        opts = variant.options()
        assert opts["solver"] == "hipo"
        assert opts["hipo_block_size"] == block_size

    def test_hipo_ipm_uses_ipx(self):
        opts = HighsVariant.HIPO_IPM.options()
        assert opts["solver"] == "ipx"
        assert "hipo_block_size" not in opts

    def test_from_value(self):
        assert HighsVariant("highs-hipo") is HighsVariant.HIPO

    def test_invalid_value_raises(self):
        with pytest.raises(ValueError):
            HighsVariant("not-a-variant")


class TestIsMipProblem:
    def test_none_model_is_false(self):
        assert is_mip_problem(None, "highs") is False

    def test_scip_with_int_vars(self):
        model = MagicMock()
        model.getNIntVars.return_value = 1
        model.getNBinVars.return_value = 0
        assert is_mip_problem(model, "scip") is True

    def test_scip_with_bin_vars(self):
        model = MagicMock()
        model.getNIntVars.return_value = 0
        model.getNBinVars.return_value = 1
        assert is_mip_problem(model, "scip") is True

    def test_scip_pure_lp(self):
        model = MagicMock()
        model.getNIntVars.return_value = 0
        model.getNBinVars.return_value = 0
        assert is_mip_problem(model, "scip") is False

    def test_gurobi(self):
        model = MagicMock(IsMIP=True)
        assert is_mip_problem(model, "gurobi") is True

    def test_highs_mip_node_count_nonnegative(self):
        model = MagicMock()
        model.getInfo.return_value = MagicMock(mip_node_count=0)
        assert is_mip_problem(model, "highs") is True

    def test_highs_mip_node_count_negative(self):
        model = MagicMock()
        model.getInfo.return_value = MagicMock(mip_node_count=-1)
        assert is_mip_problem(model, "highs") is False

    @pytest.mark.parametrize(
        "var_types,expected",
        [(["C", "I"], True), (["C", "B"], True), (["C", "C"], False)],
    )
    def test_cplex(self, var_types, expected):
        model = MagicMock()
        model.variables.get_types.return_value = var_types
        assert is_mip_problem(model, "cplex") is expected

    def test_xpress_has_mip_entities(self):
        model = MagicMock()
        model.getAttrib.return_value = 3
        assert is_mip_problem(model, "xpress") is True

    def test_xpress_no_mip_entities(self):
        model = MagicMock()
        model.getAttrib.return_value = 0
        assert is_mip_problem(model, "xpress") is False

    @pytest.mark.parametrize("solver_name", ["glpk", "cbc"])
    def test_glpk_and_cbc_always_false(self, solver_name):
        assert is_mip_problem(MagicMock(), solver_name) is False

    def test_knitro_always_false(self):
        assert is_mip_problem(MagicMock(), "knitro") is False

    def test_unsupported_solver_raises(self):
        with pytest.raises(NotImplementedError):
            is_mip_problem(MagicMock(), "not-a-solver")


class TestGetDualityGap:
    def test_none_model_returns_none(self):
        assert get_duality_gap(None, "highs") is None

    def test_scip(self):
        model = MagicMock()
        model.getGap.return_value = 0.01
        assert get_duality_gap(model, "scip") == 0.01

    def test_gurobi(self):
        model = MagicMock(MIPGap=0.02)
        assert get_duality_gap(model, "gurobi") == 0.02

    def test_highs_present(self):
        model = MagicMock()
        model.getInfo.return_value = MagicMock(mip_gap=0.03)
        assert get_duality_gap(model, "highs") == 0.03

    def test_highs_missing_attr_returns_none(self):
        model = MagicMock()
        model.getInfo.return_value = MagicMock(spec=[])
        assert get_duality_gap(model, "highs") is None

    def test_cbc_present(self):
        model = MagicMock(mip_gap=0.04)
        assert get_duality_gap(model, "cbc") == 0.04

    def test_cbc_missing_attr_returns_none(self):
        model = MagicMock(spec=[])
        assert get_duality_gap(model, "cbc") is None

    def test_glpk_always_none(self):
        assert get_duality_gap(MagicMock(), "glpk") is None

    def test_cplex(self):
        model = MagicMock()
        model.solution.MIP.get_mip_relative_gap.return_value = 0.05
        assert get_duality_gap(model, "cplex") == 0.05

    def test_xpress(self):
        model = MagicMock()
        model.controls.miprelgapnotify = 0.06
        assert get_duality_gap(model, "xpress") == 0.06

    def test_knitro_always_none(self):
        assert get_duality_gap(MagicMock(), "knitro") is None

    def test_unsupported_solver_raises(self):
        with pytest.raises(NotImplementedError):
            get_duality_gap(MagicMock(), "not-a-solver")


class TestGetReportedRuntime:
    def test_none_model_returns_none(self):
        assert get_reported_runtime("highs", None) is None

    def test_highs(self):
        model = MagicMock()
        model.getRunTime.return_value = 1.23
        assert get_reported_runtime("highs", model) == 1.23

    def test_scip(self):
        model = MagicMock()
        model.getSolvingTime.return_value = 2.34
        assert get_reported_runtime("scip", model) == 2.34

    def test_cbc(self):
        model = MagicMock(runtime=3.45)
        assert get_reported_runtime("cbc", model) == 3.45

    def test_gurobi(self):
        model = MagicMock(Runtime=4.56)
        assert get_reported_runtime("gurobi", model) == 4.56

    def test_cplex_always_none(self):
        assert get_reported_runtime("cplex", MagicMock()) is None

    def test_xpress(self):
        model = MagicMock()
        model.getAttrib.return_value = 5.67
        assert get_reported_runtime("xpress", model) == 5.67

    def test_knitro(self):
        model = MagicMock(reported_runtime=6.78)
        assert get_reported_runtime("knitro", model) == 6.78

    def test_unknown_solver_returns_none(self):
        assert get_reported_runtime("not-a-solver", MagicMock()) is None

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


class TestGetSolver:
    def _patch_solver_class(self, monkeypatch, attr_name):
        captured = {}
        fake_class = MagicMock(
            side_effect=lambda options: captured.setdefault("options", options)
        )
        monkeypatch.setattr(f"run_solver.solvers.{attr_name}", fake_class)
        return captured

    def test_highs_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs")
        assert captured["options"] == {
            "random_seed": 4,
            "mip_rel_gap": 1e-4,
            "primal_feasibility_tolerance": 1e-6,
            "dual_feasibility_tolerance": 1e-6,
            "run_crossover": "choose",
        }

    def test_glpk_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "GLPK")
        get_solver("glpk")
        assert captured["options"] == {"seed": 0, "mipgap": 1e-4}

    def test_gurobi_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Gurobi")
        get_solver("gurobi")
        assert captured["options"] == {
            "seed": 4,
            "MIPGap": 1e-4,
            "FeasibilityTol": 1e-6,
            "OptimalityTol": 1e-6,
            "SolutionTarget": 1,
        }

    def test_cplex_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Cplex")
        get_solver("cplex")
        assert captured["options"] == {
            "randomseed": 4,
            "mip.tolerances.mipgap": 1e-4,
            "simplex.tolerances.feasibility": 1e-6,
            "simplex.tolerances.optimality": 1e-6,
            "solutiontype": 2,
        }

    def test_knitro_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Knitro")
        get_solver("knitro")
        assert captured["options"] == {
            "ms_seed": 4,
            "mip_opt_gap_rel": 1e-4,
            "feastol": 1e-6,
            "opttol": 1e-6,
            "bar_maxcrossit": 0,
        }

    def test_xpress_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Xpress")
        get_solver("xpress")
        assert captured["options"] == {
            "randomseed": 4,
            "miprelstop": 1e-4,
            "FEASTOL": 1e-6,
            "OPTIMALITYTOL": 1e-6,
            "crossover": -1,
        }

    def test_mosek_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Mosek")
        get_solver("mosek")
        assert captured["options"] == {
            "MSK_IPAR_MIO_SEED": 4,
            "MSK_IPAR_INTPNT_BASIS": "MSK_BI_NEVER",
            "MSK_DPAR_MIO_TOL_REL_GAP": 1e-4,
            "MSK_DPAR_INTPNT_TOL_PFEAS": 1e-6,
            "MSK_DPAR_INTPNT_TOL_DFEAS": 1e-6,
        }

    def test_scip_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "SCIP")
        get_solver("scip")
        assert captured["options"] == {
            "randomization/randomseedshift": 0,
            "limits/gap": 1e-4,
        }

    def test_cbc_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "CBC")
        get_solver("cbc")
        assert captured["options"] == {"randomCbcSeed": 1, "ratioGap": 1e-4}

    def test_unrecognized_solver_gets_no_options(self, monkeypatch):
        # SolverName accepts some solver strings with no entry in
        # solver_options (e.g. copt) -- verify the fallback path is exercised
        # via an empty dict lookup.
        captured = self._patch_solver_class(monkeypatch, "COPT")
        get_solver("copt")
        assert captured["options"] == {}

    def test_highs_variant_overrides_seed_options(self, monkeypatch):
        captured = self._patch_solver_class(monkeypatch, "Highs")
        get_solver("highs", highs_variant=HighsVariant.HIPO_IPM)
        assert captured["options"] == HighsVariant.HIPO_IPM.options()

    def test_unsupported_solver_name_raises(self):
        with pytest.raises(ValueError):
            get_solver("not-a-solver")

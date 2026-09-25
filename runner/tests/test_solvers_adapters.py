"""Tests for runner/utils/solvers/: every solver referenced by the config
files has a matching adapter module, and every adapter exposes the methods
`solver.py` expects.
"""

import importlib
import textwrap
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from runner.utils.config import load_solver_registry
from runner.utils.solvers import SOLVER_ADAPTERS

_P = Path("problem.lp")
_S = Path("problem.sol")


def _scip_var(name, vtype):
    var = MagicMock()
    var.name = name
    var.vtype.return_value = vtype
    return var


def test_every_configured_solver_has_an_adapter():
    # solvers.yaml's `solvers` keys are the set of underlying solver
    # packages actually run -- the config-driven source of truth for what
    # needs an adapter, rather than a hardcoded list that could drift from it.
    configured_solvers = set(load_solver_registry()["solvers"])
    assert configured_solvers <= SOLVER_ADAPTERS.keys()


def test_every_adapter_exposes_the_required_methods():
    for adapter in SOLVER_ADAPTERS.values():
        assert callable(adapter.is_mip)
        assert callable(adapter.duality_gap)
        assert callable(adapter.reported_runtime)


def test_every_adapter_exposes_integer_values():
    for adapter in SOLVER_ADAPTERS.values():
        assert callable(adapter.integer_values)


class TestNativeModelIntegerValues:
    """Each adapter reads integer variables' values off its native model."""

    def test_highs(self, monkeypatch):
        highs = importlib.import_module("runner.utils.solvers.highs")
        fake_highspy = MagicMock()
        fake_highspy.HighsVarType.kInteger = "integer"
        monkeypatch.setattr(highs, "_highspy", fake_highspy)
        model = MagicMock()
        model.getSolution.return_value = SimpleNamespace(
            value_valid=True, col_value=[1.4, 2.0, 3.9]
        )
        model.getLp.return_value = SimpleNamespace(
            col_names_=["x", "y", "z"],
            integrality_=["integer", "integer", "continuous"],
        )
        assert highs.integer_values(model, _P, _S) == {"x": 1.4, "y": 2.0}

    def test_highs_without_a_solution(self):
        highs = importlib.import_module("runner.utils.solvers.highs")
        model = MagicMock()
        model.getSolution.return_value = SimpleNamespace(value_valid=False)
        assert highs.integer_values(model, _P, _S) is None

    def test_gurobi(self):
        gurobi = importlib.import_module("runner.utils.solvers.gurobi")
        x, y, z = (SimpleNamespace(VType=t) for t in ("I", "B", "C"))
        model = MagicMock(SolCount=1)
        model.getVars.return_value = [x, y, z]
        model.getAttr.side_effect = lambda attr, vs: {
            "VarName": ["x", "y"],
            "X": [1.4, 1.0],
        }[attr]
        assert gurobi.integer_values(model, _P, _S) == {"x": 1.4, "y": 1.0}
        assert model.getAttr.call_args[0][1] == [x, y]

    def test_gurobi_without_a_solution(self):
        gurobi = importlib.import_module("runner.utils.solvers.gurobi")
        assert gurobi.integer_values(MagicMock(SolCount=0), _P, _S) is None

    def test_scip(self):
        scip = importlib.import_module("runner.utils.solvers.scip")
        variables = [_scip_var("x", "INTEGER"), _scip_var("y", "CONTINUOUS")]
        model = MagicMock()
        model.getNSols.return_value = 1
        model.getVars.return_value = variables
        model.getSolVal.side_effect = lambda sol, var: {"x": 1.4, "y": 3.9}[var.name]
        assert scip.integer_values(model, _P, _S) == {"x": 1.4}

    def test_scip_without_a_solution(self):
        scip = importlib.import_module("runner.utils.solvers.scip")
        model = MagicMock()
        model.getNSols.return_value = 0
        assert scip.integer_values(model, _P, _S) is None

    def test_cplex(self):
        cplex = importlib.import_module("runner.utils.solvers.cplex")
        model = MagicMock()
        model.solution.is_primal_feasible.return_value = True
        model.variables.get_names.return_value = ["x", "y", "z"]
        model.variables.get_types.return_value = ["I", "B", "C"]
        model.solution.get_values.return_value = [1.4, 1.0, 3.9]
        assert cplex.integer_values(model, _P, _S) == {"x": 1.4, "y": 1.0}

    def test_cplex_without_a_solution(self):
        cplex = importlib.import_module("runner.utils.solvers.cplex")
        model = MagicMock()
        model.solution.is_primal_feasible.return_value = False
        assert cplex.integer_values(model, _P, _S) is None

    def test_xpress(self, monkeypatch):
        xpress = importlib.import_module("runner.utils.solvers.xpress")
        monkeypatch.setattr(
            xpress,
            "_xpress",
            SimpleNamespace(integer="I", binary="B", continuous="C"),
        )
        model = MagicMock()
        model.getAttrib.return_value = 1
        model.getVariable.return_value = [
            SimpleNamespace(name="x", vartype="I"),
            SimpleNamespace(name="y", vartype="B"),
            SimpleNamespace(name="z", vartype="C"),
        ]
        model.getSolution.return_value = [1.4, 1.0, 3.9]
        assert xpress.integer_values(model, _P, _S) == {"x": 1.4, "y": 1.0}

    def test_xpress_without_a_solution(self):
        xpress = importlib.import_module("runner.utils.solvers.xpress")
        model = MagicMock()
        model.getAttrib.return_value = 0
        assert xpress.integer_values(model, _P, _S) is None

    def test_mosek(self, monkeypatch):
        mosek = importlib.import_module("runner.utils.solvers.mosek")
        monkeypatch.setattr(
            mosek,
            "_mosek",
            SimpleNamespace(
                soltype=SimpleNamespace(itg="itg"),
                variabletype=SimpleNamespace(type_int="int", type_cont="cont"),
            ),
        )
        model = MagicMock()
        model.getnumintvar.return_value = 1
        model.solutiondef.return_value = True
        model.getxx.return_value = [1.4, 3.9]
        model.getnumvar.return_value = 2
        model.getvarname.side_effect = ["x", "y"].__getitem__
        model.getvartype.side_effect = ["int", "cont"].__getitem__
        assert mosek.integer_values(model, _P, _S) == {"x": 1.4}

    def test_mosek_lp_has_no_integer_values(self):
        mosek = importlib.import_module("runner.utils.solvers.mosek")
        model = MagicMock()
        model.getnumintvar.return_value = 0
        assert mosek.integer_values(model, _P, _S) == {}

    def test_knitro_is_unavailable(self):
        knitro = importlib.import_module("runner.utils.solvers.knitro")
        assert knitro.integer_values(MagicMock(), _P, _S) is None


class TestCbcIntegerValues:
    """CBC's values come from its solution file, integers from the problem file."""

    def _patch_highspy(self, monkeypatch, integrality):
        cbc = importlib.import_module("runner.utils.solvers.cbc")
        fake_highspy = MagicMock()
        fake_highspy.HighsVarType.kInteger = "integer"
        fake_highspy.Highs.return_value.getLp.return_value = SimpleNamespace(
            col_names_=list(integrality), integrality_=list(integrality.values())
        )
        monkeypatch.setattr(cbc, "_highspy", fake_highspy)
        return cbc

    def _write_solution(self, tmp_path, first_line):
        solution_fn = tmp_path / "sample_mip.sol"
        solution_fn.write_text(
            f"{first_line}\n"
            "      0 c1                     12                       0\n"
            "      0 x1                      0                       5\n"
            "      1 x2                    2.5                       0\n"
            "**    2 x3                      3                       0\n"
        )
        return solution_fn

    def test_reads_only_integer_variables(self, monkeypatch, tmp_path):
        cbc = self._patch_highspy(
            monkeypatch, {"x1": "continuous", "x2": "integer", "x3": "integer"}
        )
        solution_fn = self._write_solution(tmp_path, "Optimal - objective value 28.5")
        assert cbc.integer_values(None, _P, solution_fn) == {"x2": 2.5, "x3": 3.0}

    def test_missing_integer_variable_makes_values_unavailable(
        self, monkeypatch, tmp_path
    ):
        cbc = self._patch_highspy(monkeypatch, {"x2": "integer", "x9": "integer"})
        solution_fn = self._write_solution(tmp_path, "Optimal - objective value 28.5")
        assert cbc.integer_values(None, _P, solution_fn) is None

    def test_infeasible_has_no_values(self, monkeypatch, tmp_path):
        cbc = self._patch_highspy(monkeypatch, {"x2": "integer"})
        solution_fn = self._write_solution(tmp_path, "Infeasible - objective value 0")
        assert cbc.integer_values(None, _P, solution_fn) is None

    def test_lp_has_no_integer_values(self, monkeypatch, tmp_path):
        cbc = self._patch_highspy(monkeypatch, {"x1": "continuous"})
        assert cbc.integer_values(None, _P, tmp_path / "unused.sol") == {}

    def test_without_highspy_values_are_unavailable(self, monkeypatch):
        cbc = importlib.import_module("runner.utils.solvers.cbc")
        monkeypatch.setattr(cbc, "_highspy", None)
        assert cbc.integer_values(None, _P, _S) is None


class TestGlpkIntegerValues:
    """GLPK's values and integer markers both come from its solution report."""

    _MIP_REPORT = textwrap.dedent(
        """\
        Problem:
        Rows:       3
        Columns:    3 (2 integer, 0 binary)
        Non-zeros:  9
        Status:     INTEGER OPTIMAL
        Objective:  obj = 28 (MINimum)

           No.   Row name        Activity     Lower bound   Upper bound
        ------ ------------    ------------- ------------- -------------
             1 c1                         12            12

           No. Column name       Activity     Lower bound   Upper bound
        ------ ------------    ------------- ------------- -------------
             1 x1                          0             0             4
             2 x2           *              3             0             3
             3 a_very_long_column_name
                            *            2.5             0             5

        Integer feasibility conditions:
        """
    )

    def _write(self, tmp_path, text):
        solution_fn = tmp_path / "sample.sol"
        solution_fn.write_text(text)
        return solution_fn

    def test_reads_integer_columns_including_wrapped_names(self, tmp_path):
        glpk = importlib.import_module("runner.utils.solvers.glpk")
        solution_fn = self._write(tmp_path, self._MIP_REPORT)
        assert glpk.integer_values(None, _P, solution_fn) == {
            "x2": 3.0,
            "a_very_long_column_name": 2.5,
        }

    def test_incomplete_table_makes_values_unavailable(self, tmp_path):
        glpk = importlib.import_module("runner.utils.solvers.glpk")
        report = self._MIP_REPORT.replace("(2 integer", "(3 integer")
        assert glpk.integer_values(None, _P, self._write(tmp_path, report)) is None

    def test_undefined_solution_has_no_values(self, tmp_path):
        glpk = importlib.import_module("runner.utils.solvers.glpk")
        report = self._MIP_REPORT.replace("INTEGER OPTIMAL", "INTEGER UNDEFINED")
        assert glpk.integer_values(None, _P, self._write(tmp_path, report)) is None

    def test_lp_has_no_integer_values(self, tmp_path):
        glpk = importlib.import_module("runner.utils.solvers.glpk")
        report = "Problem:\nRows:       3\nColumns:    3\nStatus:     OPTIMAL\n\n"
        assert glpk.integer_values(None, _P, self._write(tmp_path, report)) == {}


class TestCbcDualityGap:
    """CBC's gap comes from its log, not its rounded ``Gap:`` line."""

    def _gap(self, tmp_path, log_text):
        cbc = importlib.import_module("runner.utils.solvers.cbc")
        log_fn = tmp_path / "cbc.log"
        log_fn.write_text(log_text)
        return cbc.duality_gap(MagicMock(mip_gap=0.0), log_fn)

    def test_gap_tolerance_exit_uses_objective_and_bound(self, tmp_path):
        # From a real CBC run on FINE-water-supply-system-12-8760ts, where
        # CBC's own "Gap:" line rounds 0.0035 down to 0.00
        log = (
            "Cbc0011I Exiting as integer gap of 3.9777742 less than 1e-10 or 5%\n"
            "Cbc0001I Search completed - best objective 1138.452576141979\n"
            "Result - Optimal solution found (within gap tolerance)\n\n"
            "Objective value:                1138.45257614\n"
            "Lower bound:                    1134.475\n"
            "Gap:                            0.00\n"
        )
        assert self._gap(tmp_path, log) == pytest.approx(
            (1138.45257614 - 1134.475) / 1138.45257614
        )

    def test_completed_search_has_zero_gap(self, tmp_path):
        log = (
            "Cbc0001I Search completed - best objective 1444.372702107476\n"
            "Result - Optimal solution found\n\n"
            "Objective value:                1444.37270211\n"
        )
        assert self._gap(tmp_path, log) == 0.0

    def test_unknown_without_a_bound_or_completed_search(self, tmp_path):
        log = "Result - Stopped on time limit\n\nObjective value:  1.0\n"
        assert self._gap(tmp_path, log) is None

    def test_missing_log_is_unknown(self, tmp_path):
        cbc = importlib.import_module("runner.utils.solvers.cbc")
        assert cbc.duality_gap(MagicMock(), tmp_path / "missing.log") is None

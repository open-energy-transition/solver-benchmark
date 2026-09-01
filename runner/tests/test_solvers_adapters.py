"""Tests for runner/utils/solvers/: every solver referenced by the config
files has a matching adapter module, and every adapter exposes the methods
`solver.py` expects.
"""

from runner.utils.config import load_solver_registry
from runner.utils.solvers import SOLVER_ADAPTERS


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

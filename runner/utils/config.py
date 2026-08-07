"""Solver registry and the generic problem/solver eligibility-rule engine.

Backed by two data files: ``runner/config/solvers.yaml`` (versions, envs,
package names, default solver list) and ``runner/config/eligibility_rules.yaml``
(which solver/year/size/problem-class combinations are actually allowed to
run). Keeping these as data, rather than inline Python conditionals, is what
lets adding a solver version or a new runtime guard be a pure config edit.
"""

import functools
from collections.abc import Callable
from pathlib import Path
from typing import Any

import yaml

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_SOLVERS_CONFIG_PATH = _CONFIG_DIR / "solvers.yaml"
_ELIGIBILITY_RULES_PATH = _CONFIG_DIR / "eligibility_rules.yaml"
_SOLVER_CONFIGURATIONS_PATH = _CONFIG_DIR / "solver_configurations.yaml"

# Comparison operators available to eligibility_rules.yaml's conditions. Each
# takes (actual_value, expected_value_from_yaml) and returns whether it matches.
_OPERATORS: dict[str, Callable[[Any, Any], bool]] = {
    "in": lambda actual, expected: str(actual) in {str(v) for v in expected},
    "not_in": lambda actual, expected: str(actual) not in {str(v) for v in expected},
    "eq": lambda actual, expected: str(actual) == str(expected),
    "gte": lambda actual, expected: (
        actual is not None and float(actual) >= float(expected)
    ),
    "lte": lambda actual, expected: (
        actual is not None and float(actual) <= float(expected)
    ),
}


@functools.cache
def load_solver_config(config_path: Path = _SOLVERS_CONFIG_PATH) -> dict[str, Any]:
    """Load the solver registry from ``runner/config/solvers.yaml``.

    Parameters
    ----------
    config_path : Path, optional
        Path to the YAML file to load. Defaults to the repo's own
        ``runner/config/solvers.yaml``; overridable for testing.

    Returns
    -------
    dict[str, Any]
        Parsed YAML with top-level keys ``solvers``, ``packages``, and
        ``default_solvers``.
    """
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


@functools.cache
def load_eligibility_rules(
    config_path: Path = _ELIGIBILITY_RULES_PATH,
) -> dict[str, Any]:
    """Load the eligibility rules from ``runner/config/eligibility_rules.yaml``.

    Parameters
    ----------
    config_path : Path, optional
        Path to the YAML file to load. Defaults to the repo's own
        ``runner/config/eligibility_rules.yaml``; overridable for testing.

    Returns
    -------
    dict[str, Any]
        Parsed YAML with a single top-level ``rules`` list.
    """
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


@functools.cache
def load_solver_configurations(
    config_path: Path = _SOLVER_CONFIGURATIONS_PATH,
) -> dict[str, Any]:
    """Load the solver configurations from ``runner/config/solver_configurations.yaml``.

    Parameters
    ----------
    config_path : Path, optional
        Path to the YAML file to load. Defaults to the repo's own
        ``runner/config/solver_configurations.yaml``; overridable for testing.

    Returns
    -------
    dict[str, Any]
        Parsed YAML with top-level keys ``shared`` (target values common to
        multiple configurations) and ``configurations`` (one entry per named
        way of running a solver, each with a ``solver`` and ``options``).
    """
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def get_solver_configuration(
    name: str, config: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    """Look up a solver configuration (e.g. ``"highs"`` or ``"highs-hipo"``).

    A configuration is requested as if it were its own solver, so it gets its
    own row in benchmark results, but runs through -- and shares the model
    API of -- whichever solver package it names in
    ``solver_configurations.yaml``.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs"`` or ``"highs-hipo"``.
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict, e.g. for testing with a
        fake configuration. Defaults to :func:`load_solver_configurations`.

    Returns
    -------
    dict[str, Any] | None
        ``{"solver": str, "options": dict}`` (with any ``{"shared": <name>}``
        option values resolved) if `name` is a registered configuration,
        else None.
    """
    config = config if config is not None else load_solver_configurations()
    configuration = config.get("configurations", {}).get(name.lower())
    if configuration is None:
        return None
    shared = config.get("shared", {})
    options = {
        key: shared[value["shared"]] if isinstance(value, dict) else value
        for key, value in configuration["options"].items()
    }
    return {"solver": configuration["solver"], "options": options}


def resolve_solver_name(name: str, config: dict[str, Any] | None = None) -> str:
    """Resolve a configuration name to the real solver package that runs it.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs-hipo"`` or ``"gurobi"``.
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict. Defaults to
        :func:`load_solver_configurations`.

    Returns
    -------
    str
        The configuration's `solver` if `name` is registered, otherwise
        `name` itself (lowercased).
    """
    configuration = get_solver_configuration(name, config)
    return configuration["solver"] if configuration else name.lower()


def get_solver_options(
    name: str, config: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Return a configuration's tuning options, with `shared` references resolved.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs"`` or ``"highs-hipo"``.
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict, e.g. for testing with
        fake options. Defaults to :func:`load_solver_configurations`.

    Returns
    -------
    dict[str, Any]
        The configuration's options, ready to pass to its linopy solver
        constructor. Empty if `name` has no entry in
        ``solver_configurations.yaml``.
    """
    configuration = get_solver_configuration(name, config)
    return configuration["options"] if configuration else {}


def get_default_solvers(config: dict[str, Any] | None = None) -> list[str]:
    """Return the CLI's default ``--solvers`` list.

    Parameters
    ----------
    config : dict[str, Any], optional
        A pre-loaded solver config, e.g. for testing with a fake registry.
        Defaults to :func:`load_solver_config`.

    Returns
    -------
    list[str]
        Solver names to run when none are explicitly requested.
    """
    config = config if config is not None else load_solver_config()
    return list(config.get("default_solvers", []))


def get_conda_package_name(
    solver_name: str, config: dict[str, Any] | None = None
) -> str:
    """Return the conda/pip package name that provides a solver.

    Parameters
    ----------
    solver_name : str
        The solver's name as used throughout the runner (e.g. ``"highs"``).
    config : dict[str, Any], optional
        A pre-loaded solver config. Defaults to :func:`load_solver_config`.

    Returns
    -------
    str
        The package name, e.g. ``"highspy"`` for ``"highs"``. Falls back to
        `solver_name` itself if there's no entry in ``solvers.yaml``'s
        ``packages`` map.
    """
    config = config if config is not None else load_solver_config()
    return config.get("packages", {}).get(solver_name, solver_name)


def _condition_matches(
    facts: dict[str, Any], condition: dict[str, dict[str, Any]]
) -> bool:
    """Check whether every fact referenced in `condition` satisfies its operators.

    Parameters
    ----------
    facts : dict[str, Any]
        The actual values being checked, e.g. ``{"year": "2026", ...}``.
    condition : dict[str, dict[str, Any]]
        A mapping of fact name to ``{operator: expected_value}``, as found
        under a rule's ``when`` or an ``allow_any_of`` alternative in
        eligibility_rules.yaml.

    Returns
    -------
    bool
        True if `facts` satisfies every operator in `condition`. A fact name
        absent from `condition` is treated as unconstrained (always matches).
    """
    for key, op_spec in condition.items():
        actual = facts.get(key)
        for op, expected in op_spec.items():
            if not _OPERATORS[op](actual, expected):
                return False
    return True


def is_solver_eligible(
    solver: str,
    year: str,
    size_category: str | None = None,
    problem_class: str | None = None,
    rules: dict[str, Any] | None = None,
) -> bool:
    """Check whether a solver/year is eligible to run against a problem.

    Evaluates ``eligibility_rules.yaml``'s rule engine: a rule only restricts
    eligibility if its ``when`` matches the given facts, in which case at
    least one of its ``allow_any_of`` alternatives must also match, or the
    combination is ineligible. Rules that don't trigger impose no restriction.
    Multiple triggered rules are AND'ed together.

    Parameters
    ----------
    solver : str
        The solver's name, e.g. ``"highs"`` or ``"highs-hipo"``.
    year : str
        The solver-version year being considered, e.g. ``"2026"``.
    size_category : str, optional
        The problem's size category (e.g. ``"S"``, ``"M"``, ``"L"``), if
        relevant to the check. Omit if unknown -- rules that inspect it
        simply won't match.
    problem_class : str, optional
        The problem's class (e.g. ``"LP"``, ``"MILP"``), if relevant.
    rules : dict[str, Any], optional
        A pre-loaded rules config, e.g. for testing with fake rules. Defaults
        to :func:`load_eligibility_rules`.

    Returns
    -------
    bool
        True if the combination is eligible to run.
    """
    rules = rules if rules is not None else load_eligibility_rules()
    facts = {
        "solver": solver,
        "year": year,
        "size_category": size_category,
        "problem_class": problem_class,
    }
    for rule in rules.get("rules", []):
        if not _condition_matches(facts, rule.get("when", {})):
            continue
        if not any(
            _condition_matches(facts, alt) for alt in rule.get("allow_any_of", [])
        ):
            return False
    return True

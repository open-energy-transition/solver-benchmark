"""Solver registry, solver configurations, and the eligibility-rule engine.

Backed by three data files: ``runner/config/solvers.yaml`` (per-solver
versions, envs, package names), ``runner/config/solver_configurations.yaml``
(tuning options per named way of running a solver, plus the CLI's default
list), and ``runner/config/eligibility_rules.yaml`` (which solver/year/size/
problem-class combinations are actually allowed to run). Keeping these as
data, rather than inline Python conditionals, is what lets adding a solver
version, a new tuning configuration, or a new runtime guard be a pure config
edit.
"""

import functools
from collections.abc import Callable
from pathlib import Path
from typing import Any

import yaml

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_SOLVER_REGISTRY_PATH = _CONFIG_DIR / "solvers.yaml"
_ELIGIBILITY_RULES_PATH = _CONFIG_DIR / "eligibility_rules.yaml"
_SOLVER_CONFIGURATIONS_PATH = _CONFIG_DIR / "solver_configurations.yaml"


def _to_float(value: Any) -> float | None:
    """Coerce to float for `gte`/`lte`, or None if that's not possible.

    `year` can be the non-numeric pseudo-year `"tests"` (see
    `env.get_registered_solver_versions`), which should simply not match a
    numeric bound rather than crash the whole eligibility check.
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# Comparison operators available to eligibility_rules.yaml's conditions. Each
# takes (actual_value, expected_value_from_yaml) and returns whether it matches.
_OPERATORS: dict[str, Callable[[Any, Any], bool]] = {
    "in": lambda actual, expected: str(actual) in {str(v) for v in expected},
    "not_in": lambda actual, expected: str(actual) not in {str(v) for v in expected},
    "eq": lambda actual, expected: str(actual) == str(expected),
    "gte": lambda actual, expected: (
        _to_float(actual) is not None and _to_float(actual) >= float(expected)
    ),
    "lte": lambda actual, expected: (
        _to_float(actual) is not None and _to_float(actual) <= float(expected)
    ),
}


@functools.cache
def load_solver_registry(config_path: Path = _SOLVER_REGISTRY_PATH) -> dict[str, Any]:
    """Load the solver registry from ``runner/config/solvers.yaml``.

    Parameters
    ----------
    config_path : Path, optional
        Path to the YAML file to load. Defaults to the repo's own
        ``runner/config/solvers.yaml``; overridable for testing.

    Returns
    -------
    dict[str, Any]
        Parsed YAML with top-level keys ``solvers`` and ``packages``.
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
        multiple configurations), ``default_configurations`` (names to run
        when the CLI is given none explicitly), and ``configurations`` (one
        entry per named way of running a solver, each with a ``solver`` and
        ``options``).
    """
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def get_solver_configuration(
    name: str, config: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    """Look up a solver configuration (e.g. ``"highs-default"`` or ``"highs-hipo"``).

    A configuration is requested as if it were its own solver, so it gets its
    own row in benchmark results, but runs through -- and shares the model
    API of -- whichever solver package it names in
    ``solver_configurations.yaml``.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs-default"`` or ``"highs-hipo"``.
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict, e.g. for testing with a
        fake configuration. Defaults to :func:`load_solver_configurations`.

    Returns
    -------
    dict[str, Any] | None
        ``{"solver_package": str, "options": dict}`` (with any
        ``{"shared": <name>}`` option values resolved) if `name` is a
        registered configuration, else None.
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
    return {"solver_package": configuration["solver_package"], "options": options}


def resolve_solver_name(name: str, config: dict[str, Any] | None = None) -> str:
    """Resolve a configuration name to the real solver package that runs it.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs-hipo"`` or ``"gurobi-default"``.
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict. Defaults to
        :func:`load_solver_configurations`.

    Returns
    -------
    str
        The configuration's `solver_package` if `name` is registered,
        otherwise `name` itself (lowercased).
    """
    configuration = get_solver_configuration(name, config)
    return configuration["solver_package"] if configuration else name.lower()


def get_solver_options(
    name: str, config: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Return a configuration's tuning options, with `shared` references resolved.

    Parameters
    ----------
    name : str
        The configuration's name, e.g. ``"highs-default"`` or ``"highs-hipo"``.
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


def get_default_configurations(config: dict[str, Any] | None = None) -> list[str]:
    """Return the solver configurations to run when the CLI is given none explicitly.

    Parameters
    ----------
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict, e.g. for testing with a
        fake default list. Defaults to :func:`load_solver_configurations`.

    Returns
    -------
    list[str]
        Names of entries in ``solver_configurations.yaml``'s ``configurations``
        (e.g. ``["highs-default", "scip-default", ...]``), not necessarily raw
        solver package names -- the CLI's `--solver-configurations` flag
        takes configurations, not solvers.
    """
    config = config if config is not None else load_solver_configurations()
    return list(config.get("default_configurations", []))


def get_all_registered_years(config: dict[str, Any] | None = None) -> list[str]:
    """Return every year with at least one registered solver version.

    Used as the CLI's default ``--years`` list when none is given, so a new
    solver-version year (added to ``solvers.yaml``) is picked up
    automatically rather than needing a matching CLI code change. Excludes
    the ``tests`` block: that's CI's shared smoke-test env, not a real
    release year, and shouldn't be swept into a "run everything" default.

    Parameters
    ----------
    config : dict[str, Any], optional
        A pre-loaded solver registry. Defaults to :func:`load_solver_registry`.

    Returns
    -------
    list[str]
        Every distinct ``year`` value across ``solvers.yaml``'s ``solvers``
        block, sorted ascending.
    """
    config = config if config is not None else load_solver_registry()
    years = {
        str(entry["year"])
        for versions in config.get("solvers", {}).values()
        for entry in versions.values()
    }
    return sorted(years)


def get_package_name(solver_package: str, config: dict[str, Any] | None = None) -> str:
    """Return the PyPI package name that provides a solver.

    Parameters
    ----------
    solver_package : str
        The underlying solver package, e.g. ``"highs"``.
    config : dict[str, Any], optional
        A pre-loaded solver registry. Defaults to :func:`load_solver_registry`.

    Returns
    -------
    str
        The package name, e.g. ``"highspy"`` for ``"highs"``. Falls back to
        `solver_package` itself if there's no entry in ``solvers.yaml``'s
        ``packages`` map.
    """
    config = config if config is not None else load_solver_registry()
    return config.get("packages", {}).get(solver_package, solver_package)


def get_license_env_vars(
    solver_package: str, config: dict[str, Any] | None = None
) -> list[str]:
    """Return the env vars holding license info/paths a solver package needs.

    Parameters
    ----------
    solver_package : str
        The underlying solver package, e.g. ``"mosek"``.
    config : dict[str, Any], optional
        A pre-loaded solver registry. Defaults to :func:`load_solver_registry`.

    Returns
    -------
    list[str]
        Env var names to forward to a solver subprocess that doesn't
        otherwise inherit the caller's environment (see
        `execution.run_solver`). Empty if `solver_package` has no entry in
        ``solvers.yaml``'s ``license_env_vars`` map.
    """
    config = config if config is not None else load_solver_registry()
    return list(config.get("license_env_vars", {}).get(solver_package, []))


def get_seed_option(
    solver_package: str, config: dict[str, Any] | None = None
) -> str | None:
    """Return the options key that holds a solver package's random seed.

    Parameters
    ----------
    solver_package : str
        The underlying solver package, e.g. ``"highs"``.
    config : dict[str, Any], optional
        A pre-loaded solver registry. Defaults to :func:`load_solver_registry`.

    Returns
    -------
    str | None
        The key into a configuration's ``options`` dict that holds its seed
        (e.g. ``"random_seed"`` for ``"highs"``), or None if `solver_package`
        has no entry in ``solvers.yaml``'s ``seed_options`` map.
    """
    config = config if config is not None else load_solver_registry()
    return config.get("seed_options", {}).get(solver_package)


def _resolve_fact(facts: dict[str, Any], path: str) -> Any:
    """Look up a fact, following a dotted `path` into nested dict facts.

    Parameters
    ----------
    facts : dict[str, Any]
        The actual values being checked, e.g. ``{"options": {"solver": "hipo"}}``.
    path : str
        A fact name, optionally dotted to reach into a nested dict fact, e.g.
        ``"year"`` or ``"options.solver"``.

    Returns
    -------
    Any
        The resolved value, or None if `path` isn't present (including when
        an intermediate segment isn't a dict).
    """
    value: Any = facts
    for part in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _condition_matches(
    facts: dict[str, Any], condition: dict[str, dict[str, Any]]
) -> bool:
    """Check whether every fact referenced in `condition` satisfies its operators.

    Parameters
    ----------
    facts : dict[str, Any]
        The actual values being checked, e.g. ``{"year": "2026", ...}``.
    condition : dict[str, dict[str, Any]]
        A mapping of fact name (optionally dotted, see :func:`_resolve_fact`)
        to ``{operator: expected_value}``, as found under a rule's ``when``
        or an ``allow_any_of`` alternative in eligibility_rules.yaml.

    Returns
    -------
    bool
        True if `facts` satisfies every operator in `condition`. A fact name
        absent from `condition` is treated as unconstrained (always matches).
    """
    for key, op_spec in condition.items():
        actual = _resolve_fact(facts, key)
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
    config: dict[str, Any] | None = None,
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
        The solver's name, e.g. ``"highs-default"`` or ``"highs-hipo"``.
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
    config : dict[str, Any], optional
        A pre-loaded solver_configurations.yaml dict, used to resolve
        `solver`'s ``solver_package``/``options`` facts (see Notes). Defaults
        to :func:`load_solver_configurations`.

    Returns
    -------
    bool
        True if the combination is eligible to run.

    Notes
    -----
    Also exposes ``solver_package`` (the underlying package, e.g. ``"highs"``
    for both ``"highs-default"`` and ``"highs-hipo"``) and ``options`` (that
    configuration's resolved tuning options). A rule can dot into ``options``
    (e.g. ``options.solver`` for HiGHS's hipo/ipx choice), scoped by
    ``solver_package``, to restrict an underlying setting once instead of
    enumerating every configuration name that sets it.
    """
    rules = rules if rules is not None else load_eligibility_rules()
    configuration = get_solver_configuration(solver, config)
    facts = {
        "solver": solver,
        "solver_package": (
            configuration["solver_package"] if configuration else solver.lower()
        ),
        "year": year,
        "size_category": size_category,
        "problem_class": problem_class,
        "options": configuration.get("options", {}) if configuration else {},
    }
    for rule in rules.get("rules", []):
        if not _condition_matches(facts, rule.get("when", {})):
            continue
        if not any(
            _condition_matches(facts, alt) for alt in rule.get("allow_any_of", [])
        ):
            return False
    return True

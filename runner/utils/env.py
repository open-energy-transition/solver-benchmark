"""Solver version/environment introspection: which solver package version is
actually installed, and which per-solver-year env provides a given solver
configuration for a given run.

Each solver-year has its own pixi manifest under `runner/envs/<env>/` (its
own `pixi.toml`/`pixi.lock`, not part of the root workspace) -- isolating
them per directory, rather than as more environments in the root
`pixi.toml`, keeps that file scoped to this project's own tooling and lets
each solver-year resolve (and fail) independently of the others.
"""

import json
import subprocess
from pathlib import Path

from . import config

_ENVS_DIR = Path(__file__).resolve().parent.parent / "envs"


def get_installed_solver_versions(
    solver_configurations: list[str], env_name: str
) -> dict[str, str | None]:
    """Read each configuration's version as actually installed in a pixi env.

    Queries `pixi list` directly, so this reflects the real, current state
    of that specific env -- as opposed to `get_registered_solver_versions`,
    which reads the static `solvers.yaml` registry of what's declared/
    expected for a given year.

    Parameters
    ----------
    solver_configurations : list[str]
        Solver configuration names to look up (e.g.
        `["highs-hipo", "cbc-default"]`); each is resolved to its underlying
        solver via `config.resolve_solver_name`, then mapped to its package
        name via `config.get_package_name` (e.g. "highs-hipo" and
        "highs-default" both map to the "highspy" package).
    env_name : str
        The env to inspect, i.e. the `runner/envs/<env_name>/` directory
        holding its pixi manifest.

    Returns
    -------
    dict[str, str | None]
        Configuration name to the version actually installed in that
        environment, or None if its underlying package isn't installed
        there at all.

    Raises
    ------
    ValueError
        If the `pixi list` command itself fails (e.g. the env was never
        installed).
    """
    try:
        result = subprocess.run(
            ["pixi", "list", "--manifest-path", str(_ENVS_DIR / env_name), "--json"],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing pixi list command: {e.stderr or str(e)}")

    installed_packages = {
        package["name"]: package["version"] for package in json.loads(result.stdout)
    }

    installed_versions = {}
    for configuration in solver_configurations:
        resolved_solver = config.resolve_solver_name(configuration)
        package = config.get_package_name(resolved_solver)
        installed_versions[configuration] = installed_packages.get(package, None)

    return installed_versions


def get_registered_solver_versions(
    solver_configurations: list[str], year: str
) -> dict[str, dict[str, str | None]]:
    """Look up each configuration's registered version/env for a given year.

    Reads the static `solvers.yaml` registry -- what's declared/expected for
    that year -- as opposed to `get_installed_solver_versions`, which
    queries a real env for what's actually installed right now.

    Parameters
    ----------
    solver_configurations : list[str]
        Solver configuration names to look up (e.g.
        `["highs-hipo", "cbc-default"]`); each is resolved to its underlying
        solver via `config.resolve_solver_name` before the `solvers.yaml`
        lookup, since a configuration like "highs-hipo" shares its solver's
        version/env.
    year : str
        The release year to match against `solvers.yaml`'s per-version
        `year` entries, or the literal string `"tests"` to look up
        `solvers.yaml`'s `tests` block instead (the shared env CI
        smoke-tests against, not a real release year).

    Returns
    -------
    dict[str, dict[str, str | None]]
        Configuration name to `{"version": str, "env": str | None}`.
        Configurations with no matching version for `year` are omitted.
    """
    solver_registry = config.load_solver_registry()
    registered_versions = {}
    for configuration in solver_configurations:
        resolved_solver = config.resolve_solver_name(configuration)

        if str(year) == "tests":
            entry = solver_registry.get("tests", {}).get(resolved_solver)
            if entry:
                registered_versions[configuration] = {
                    "version": entry["version"],
                    "env": entry.get("env"),
                }
            continue

        solver_entries = solver_registry["solvers"].get(resolved_solver, {})
        for version, entry in solver_entries.items():
            if str(entry["year"]) == str(year):
                registered_versions[configuration] = {
                    "version": version,
                    "env": entry.get("env"),
                }
                break

    return registered_versions


def ensure_solver_envs_installed(
    registered_versions: dict[str, dict[str, str | None]],
) -> None:
    """Install any envs named in `registered_versions` that aren't ready yet.

    Each env is its own pixi manifest at `runner/envs/<env>/pixi.toml`.
    `pixi install` is idempotent and fast (a no-op check) when an env is
    already installed and up to date with its lock file, so this always
    invokes it rather than tracking installed state itself. A failed or
    missing manifest is logged and skipped rather than raised, so one bad
    env doesn't stop every other solver from running.

    Parameters
    ----------
    registered_versions : dict[str, dict[str, str | None]]
        As returned by `get_registered_solver_versions`; only the `env`
        values are used here.
    """
    env_names = {v["env"] for v in registered_versions.values() if v.get("env")}
    for env_name in sorted(env_names):
        env_dir = _ENVS_DIR / env_name
        if not (env_dir / "pixi.toml").exists():
            print(f"WARNING: No pixi manifest found for env {env_name}, skipping")
            continue

        print(f"Ensuring env {env_name} is installed...")
        result = subprocess.run(
            ["pixi", "install", "--manifest-path", str(env_dir)],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(
                f"WARNING: Failed to install env {env_name}, skipping\n{result.stderr}"
            )

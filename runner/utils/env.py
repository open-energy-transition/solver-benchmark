"""Solver version/environment introspection: which solver package version is
actually installed, and which per-solver-year conda env provides a given
solver configuration for a given run.

Isolating this here (separate from `solver.py`'s dispatch logic) is what
makes migrating from conda to pixi envs (a later refactor step) a
single-file change instead of a grep-and-replace across the codebase --
public names here describe *what* they return (installed/registered
versions) or accomplish (an env being ready to use), not *how* (conda
today), so that migration only changes this file's implementation, not its
callers.
"""

import subprocess
from pathlib import Path

from . import config

_ENVS_DIR = Path(__file__).resolve().parent.parent / "envs"


def get_installed_solver_versions(
    solver_configurations: list[str], env_name: str | None = None
) -> dict[str, str | None]:
    """Read each configuration's version as actually installed in a conda env.

    Queries `conda list` directly, so this reflects the real, current state
    of that specific conda environment -- as opposed to
    `get_registered_solver_versions`, which reads the static `solvers.yaml`
    registry of what's declared/expected for a given year.

    Parameters
    ----------
    solver_configurations : list[str]
        Solver configuration names to look up (e.g.
        `["highs-hipo", "cbc-default"]`); each is resolved to its underlying
        solver via `config.resolve_solver_name`, then mapped to its
        conda/pip package name via `config.get_conda_package_name` (e.g.
        "highs-hipo" and "highs-default" both map to the "highspy" package).
    env_name : str, optional
        Conda environment to inspect. Defaults to the currently active one.

    Returns
    -------
    dict[str, str | None]
        Configuration name to the version actually installed in that
        environment, or None if its underlying package isn't installed
        there at all.

    Raises
    ------
    ValueError
        If the `conda list` command itself fails.
    """
    try:
        # List packages in the conda environment
        cmd = "conda list"
        if env_name:
            cmd += " -n " + env_name
        cmd = ["bash", "-i", "-c", cmd]

        # Run the conda list command
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Parse the output into a dictionary of package versions
        installed_packages = {}
        for line in result.stdout.splitlines():
            if not line.strip() or line.startswith(
                "#"
            ):  # Skip comments and empty lines
                continue
            parts = line.split()
            if len(parts) >= 2:  # Ensure package name and version are present
                installed_packages[parts[0]] = parts[1]

        installed_versions = {}
        for configuration in solver_configurations:
            resolved_solver = config.resolve_solver_name(configuration)
            package = config.get_conda_package_name(resolved_solver)
            installed_versions[configuration] = installed_packages.get(package, None)

        return installed_versions

    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error executing conda command: {e.stderr or str(e)}")


def get_registered_solver_versions(
    solver_configurations: list[str], year: str
) -> dict[str, dict[str, str | None]]:
    """Look up each configuration's registered version/env for a given year.

    Reads the static `solvers.yaml` registry -- what's declared/expected for
    that year -- as opposed to `get_installed_solver_versions`, which
    queries a conda environment for what's actually installed right now.

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
        `solvers.yaml`'s `tests` block instead (the shared conda env CI
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


def _list_existing_envs() -> set[str]:
    """List the names of every existing conda environment."""
    result = subprocess.run(
        ["conda", "env", "list"], capture_output=True, text=True, check=True
    )
    return {
        line.split()[0]
        for line in result.stdout.splitlines()
        if line.strip() and not line.startswith("#")
    }


def ensure_solver_envs_installed(
    registered_versions: dict[str, dict[str, str | None]],
) -> None:
    """Create any envs named in `registered_versions` that don't exist yet.

    Each env is built from `runner/envs/<env>-fixed.yaml` (pinned versions,
    preferred for reproducibility) or `runner/envs/<env>.yaml` (loose specs)
    if no fixed file exists. A failed or missing env is logged and skipped
    rather than raised, so one bad env doesn't stop every other solver from
    running.

    Parameters
    ----------
    registered_versions : dict[str, dict[str, str | None]]
        As returned by `get_registered_solver_versions`; only the `env`
        values are used here.
    """
    env_names = {v["env"] for v in registered_versions.values() if v.get("env")}
    if not env_names:
        return

    existing_envs = _list_existing_envs()
    for env_name in sorted(env_names):
        if env_name in existing_envs:
            print(f"Conda env {env_name} already exists; reusing")
            continue

        fixed_yaml = _ENVS_DIR / f"{env_name}-fixed.yaml"
        loose_yaml = _ENVS_DIR / f"{env_name}.yaml"
        env_yaml = fixed_yaml if fixed_yaml.exists() else loose_yaml
        if not env_yaml.exists():
            print(f"WARNING: No YAML found for env {env_name}, skipping")
            continue

        print(f"Creating conda env {env_name} from {env_yaml.name}...")
        result = subprocess.run(
            ["conda", "env", "create", "-q", "-f", str(env_yaml), "-y"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(
                f"WARNING: Failed to create env {env_name}, skipping\n{result.stderr}"
            )

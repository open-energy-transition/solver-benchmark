"""Solver version and environment introspection.

Which per-solver-year env provides a given solver configuration for a
given run, and whether each env really runs the solver version registered
for it.

Each solver-year has its own pixi manifest under `runner/envs/<env>/` (its
own `pixi.toml`/`pixi.lock`, not part of the root workspace) -- isolating
them per directory, rather than as more environments in the root
`pixi.toml`, keeps that file scoped to this project's own tooling and lets
each solver-year resolve (and fail) independently of the others.
"""

from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

from . import config

_ENVS_DIR = Path(__file__).resolve().parent.parent / "envs"
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def get_registered_solver_versions(
    solver_configurations: list[str], year: str
) -> dict[str, dict[str, str | None]]:
    """Look up each configuration's registered version/env for a given year.

    Reads the static `solvers.yaml` registry -- what's declared/expected for
    that year. `check_solver_versions` checks that an env really runs it.

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

    Then check that each installed env runs the solver version registered
    for it (see `check_solver_versions`).

    Each env is its own pixi manifest at `runner/envs/<env>/pixi.toml`.
    `pixi install` is idempotent and fast (a no-op check) when an env is
    already installed and up to date with its lock file, so this always
    invokes it rather than tracking installed state itself. `--locked` makes
    a manifest/lock mismatch fail instead of silently re-resolving, so a run
    only ever uses the committed lock file. A failed or
    missing manifest is logged and skipped rather than raised, so one bad
    env doesn't stop every other solver from running.

    Parameters
    ----------
    registered_versions : dict[str, dict[str, str | None]]
        As returned by `get_registered_solver_versions`.

    Raises
    ------
    ValueError
        If an installed env doesn't run its registered solver version.
    """
    env_names = {v["env"] for v in registered_versions.values() if v.get("env")}
    installed = set()
    for env_name in sorted(env_names):
        env_dir = _ENVS_DIR / env_name
        if not (env_dir / "pixi.toml").exists():
            print(f"WARNING: No pixi manifest found for env {env_name}, skipping")
            continue

        print(f"Ensuring env {env_name} is installed...")
        result = subprocess.run(
            ["pixi", "install", "--locked", "--manifest-path", str(env_dir)],
            capture_output=True,
            text=True,
            check=False,  # a failed install is logged and skipped below
        )
        if result.returncode != 0:
            print(
                f"WARNING: Failed to install env {env_name}, skipping\n{result.stderr}"
            )
        else:
            installed.add(env_name)

    check_solver_versions(
        {
            configuration: version
            for configuration, version in registered_versions.items()
            if version.get("env") in installed
        }
    )


def _release(version: str) -> tuple[int, ...]:
    """Return the numeric release of a version, without trailing zeros or suffixes.

    E.g. "1.5.0.dev0" -> (1, 5), "5.0.0" -> (5,), "22.1.2.0" -> (22, 1, 2).
    """
    match = re.match(r"\d+(?:\.\d+)*", version.strip())
    if match is None:
        return ()
    parts = [int(part) for part in match.group(0).split(".")]
    while len(parts) > 1 and parts[-1] == 0:
        parts.pop()
    return tuple(parts)


def versions_match(registered: str, actual: str) -> bool:
    """Whether a solver's reported version is the registered one.

    Compares numeric releases only, so "5.0" matches "5.0.0", and
    "1.5.0.dev0" matches HiGHS reporting "1.5.0".
    """
    return bool(_release(actual)) and _release(registered) == _release(actual)


def check_solver_versions(
    registered_versions: dict[str, dict[str, str | None]],
) -> None:
    """Check that each env runs the solver version registered for it.

    Results are labelled with the registered version, so it must be the
    version the solver itself reports when it runs, not just the version of
    an installed package. Those can differ: a PySCIPOpt wheel from PyPI
    bundles its own SCIP, which it loads instead of the env's `scip` package,
    so for months every SCIP year ran SCIP 9.2.4.

    Runs `python -m runner.utils.solvers <solver>` once per env and solver.

    Parameters
    ----------
    registered_versions : dict[str, dict[str, str | None]]
        As returned by `get_registered_solver_versions`.

    Raises
    ------
    ValueError
        Listing every env that runs a different version, or whose solver
        version couldn't be read.
    """
    checks = {
        (config.resolve_solver_name(configuration), entry["version"], entry["env"])
        for configuration, entry in registered_versions.items()
        if entry.get("env") and entry.get("version")
    }
    # `runner` must resolve as a package inside the env, as for the solves
    # themselves (see `execution.run_solver`)
    subprocess_env = dict(os.environ)
    subprocess_env["PYTHONPATH"] = os.pathsep.join(
        [str(_REPO_ROOT), subprocess_env.get("PYTHONPATH", "")]
    )

    problems = []
    for solver, registered, env_name in sorted(checks):
        result = subprocess.run(
            [
                "pixi",
                "run",
                "--locked",
                "--manifest-path",
                str(_ENVS_DIR / env_name),
                "python",
                "-m",
                "runner.utils.solvers",
                solver,
            ],
            capture_output=True,
            text=True,
            check=False,
            env=subprocess_env,
        )
        # The version is the last line; a solver may print a banner first
        lines = result.stdout.strip().splitlines()
        if result.returncode != 0 or not lines:
            error = (result.stderr.strip().splitlines() or ["no output"])[-1]
            problems.append(f"{env_name}: couldn't read the {solver} version: {error}")
            continue
        actual = lines[-1].strip()
        if versions_match(registered, actual):
            print(f"{env_name} runs {solver} {actual}")
        else:
            problems.append(
                f"{env_name} runs {solver} {actual}, but solvers.yaml registers "
                f"{registered}"
            )

    if problems:
        raise ValueError("solver version check failed:\n  " + "\n  ".join(problems))

# Supported Solvers

We support the following versions of solvers: (We use the last released solver version in each calendar year.)

| Solver | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
| ------ | ---- | ---- | ---- | ---- | ---- | ---- |
| HiGHS | | [Not on PyPI](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L16) | 1.5.0 | 1.6.0 | 1.9.0 | 1.12.0 |
| SCIP | 7.0.2 [errors](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L13) | 7.0.3 [errors](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L12) | 8.0.3 | 8.1.0 | 9.2.0 | 10.0.0 |
| CBC | 2.10.5 [errors](https://github.com/coin-or/Cbc/issues/708) | | 2.10.8 [errors](https://github.com/coin-or/Cbc/issues/708) | 2.10.11 | 2.10.12 | no release |
| GLPK | 5.0.0 |  |  |  |  |  |
| Gurobi | 9.1.1 [incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L16) | 9.5.0 [incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L14) | 10.0.0 | 11.0.0 | 12.0.0 | 13.0.0 |


When determining which is the most recent version released in a particular year, we use the following resources:
- https://github.com/ERGO-Code/HiGHS/releases
- https://github.com/coin-or/Cbc/releases
- https://github.com/scipopt/scip/releases and https://anaconda.org/channels/conda-forge/packages/scip/files
- https://support.gurobi.com/hc/en-us/articles/360048138771-Gurobi-release-and-support-history

## Updating Solver Versions

Each solver-year has its own pixi manifest at `runner/envs/benchmark-<solver>-<year>/pixi.toml` (self-contained, with its own `pixi.lock` -- not part of the root workspace). To add or update one:

1. Create or edit `runner/envs/benchmark-<solver>-<year>/pixi.toml`, pinning the new version (copy an existing manifest for the same solver as a starting point for its channels/shared deps).
2. Run `pixi install --manifest-path runner/envs/benchmark-<solver>-<year>` to resolve and generate its `pixi.lock`. Commit both files.
3. Add or update the matching entry in `runner/config/solvers.yaml` (`year`, `env: benchmark-<solver>-<year>`).

If a solver package pins a Python version range that's narrower than what conda-forge currently resolves to by default (i.e. it has no wheel for the newest Python), pin `python` in that manifest accordingly -- several existing manifests do this for exactly that reason (see their comments).

**NOTE**: HiGHS v1.6.0 (2023's version) was never released to PyPI, so `runner/envs/benchmark-highs-2023/pixi.toml` installs it straight from its GitHub tag via a `[pypi-dependencies]` git entry (`{ git = "...", tag = "v1.6.0" }`) -- `pixi.lock` preserves this correctly, no manual workaround needed.

## Adding a New Solver

Onboarding a solver package we don't support at all yet (as opposed to a new version of one we already support -- see [Updating Solver Versions](#updating-solver-versions) above) needs:

1. Confirm [linopy](https://github.com/PyPSA/linopy) already supports it (`linopy.solvers.SolverName` lists every solver it knows how to drive) -- everything below assumes it does. If not, that support has to land in linopy first.
2. Its per-solver-year pixi manifest(s) under `runner/envs/` (step 1 of [Updating Solver Versions](#updating-solver-versions) above).
3. A registry entry in `runner/config/solvers.yaml`'s `solvers` map (version/year/env), plus a `packages` entry if its PyPI package name differs from the solver's own name, plus a `license_env_vars` entry if it needs a license env var forwarded under `systemd-run` (see that file's own header comment for the full schema).
4. A solver adapter module at `runner/utils/solvers/<solver_package>.py` exporting `is_mip(model)`, `duality_gap(model)`, and `reported_runtime(model)` -- copy any existing module there as a template. It's auto-discovered by filename; nothing else needs to import or register it (see `runner/utils/solvers/__init__.py`'s own docstring).
5. At least a `<solver_package>-default` entry in `runner/config/solver_configurations.yaml` (see [Adding a New Solver Configuration](#adding-a-new-solver-configuration) below), and add it to `default_configurations` there if it should run whenever the CLI is given no explicit `--solver-configurations`.

## Adding a New Solver Configuration

A "configuration" is a named way of running a solver package -- its default settings, or a specific tuned algorithm/variant (e.g. `highs-hipo`) -- each reported as its own row in results. Adding one for an existing solver package (or a first tuned variant for a solver that only has its `-default` configuration so far) is purely a new entry in `runner/config/solver_configurations.yaml`'s `configurations` map, no Python code. See that file's own header comment for the full schema (`solver_package`, `options`, the `{shared: <name>}` syntax for tolerances shared across configurations).

## Adding a New Eligibility Rule

Eligibility rules restrict which solver/year/size/problem-class combinations are actually run (e.g. a solver's algorithm only being available from a certain year onward). Adding one is purely a new entry in `runner/config/eligibility_rules.yaml`'s `rules` list, no Python code -- rules are evaluated generically by `runner/utils/config.py`'s `is_solver_eligible()` against whatever facts a rule's `when`/`allow_any_of` reference (including dotted paths into a configuration's own `options`, e.g. `options.solver`). See that file's own header comment for the full schema and the comparison operators available (`in`, `not_in`, `eq`, `gte`, `lte`).

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

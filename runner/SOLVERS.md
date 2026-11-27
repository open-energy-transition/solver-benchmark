# Solvers

For each solver, the benchmark uses the last version released in each calendar year. The versions are registered in [`config/solvers.yaml`](config/solvers.yaml):

| Solver | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| ------ | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| HiGHS | | (1) | 1.5.0.dev0 | 1.6.0 | 1.9.0 | 1.12.0 | 1.15.1 |
| SCIP | (2) | (2) | 8.0.3 | 8.1.0 | 9.2.0 | 10.0.0 | |
| CBC | (3) | | (3) | 2.10.11 | 2.10.12 | | |
| GLPK | 5.0 | | | | | | |
| Gurobi | (4) | (4) | 10.0.0 | 11.0.0 | 12.0.0 | 13.0.0 | |

An empty cell is a year without a release or, for 2026, a version not added yet. The numbered cells are versions that are not run:

1. HiGHS 1.1.1 was not released on PyPI and cannot be installed with pip or conda.
2. SCIP 7.0.2 and 7.0.3 fail with PySCIPOpt: `'pyscipopt.scip.Model' object has no attribute 'getDualSolVal'`.
3. CBC 2.10.5 and 2.10.8 fail on some problems ([coin-or/Cbc#708](https://github.com/coin-or/Cbc/issues/708)).
4. Gurobi 9.1.1 and 9.5.0 need Python versions that Linopy does not support.

The runner also supports CPLEX 22.1.2.0, MOSEK 11.0.30, Knitro 15.1.0 and Xpress 9.6.2 (2025), which need a license and are not run by default.

The release years come from:

- https://github.com/ERGO-Code/HiGHS/releases
- https://github.com/coin-or/Cbc/releases
- https://github.com/scipopt/scip/releases and https://anaconda.org/channels/conda-forge/packages/scip/files
- https://support.gurobi.com/hc/en-us/articles/360048138771-Gurobi-release-and-support-history

## Updating a solver version

Each solver version has its own pixi manifest at `envs/benchmark-<solver>-<year>/pixi.toml`, with its own `pixi.lock`, outside the root workspace. To add or update one:

1. Create or edit the manifest, pinning the new version. Copy an existing manifest of the same solver for its channels and other dependencies.
2. Run `pixi install --manifest-path runner/envs/benchmark-<solver>-<year>` to generate its `pixi.lock`, and commit both files.
3. Add or update the version's entry in `config/solvers.yaml`, with its `year` and `env`.

If the solver package has no build for the newest Python, pin `python` in the manifest; several manifests do this, with the reason in a comment. HiGHS 1.6.0 was never released on PyPI, so `benchmark-highs-2023` installs it from its GitHub tag. The runner checks that each environment runs its registered version (see [README.md](README.md#running-benchmarks)).

## Adding a new solver

1. Check that [Linopy](https://github.com/PyPSA/linopy) supports the solver: `linopy.solvers.SolverName` lists the solvers it can run.
2. Add a pixi manifest for each of its versions, as in [Updating a solver version](#updating-a-solver-version).
3. Add the solver to `config/solvers.yaml`: its versions under `solvers`, and its entries in `packages` and `seed_options`, in `timeout_options` if it has a time limit option, and in `license_env_vars` if it needs a license. The header of the file describes each section.
4. Add an adapter module `utils/solvers/<solver_package>.py` that exports `solver_version()`, `is_mip(model)`, `mip_gap(model, log_fn)`, `reported_runtime(model)` and `integer_values(model, problem_fn, solution_fn)`. Copy an existing module as a template: the runner finds the module by its file name, so nothing else needs to change.
5. Add at least a `<solver_package>-default` configuration (see below), and list it in `default_configurations` if it should run when no configuration is given.

## Adding a solver configuration

A configuration is a named way of running a solver, such as its default settings or a specific algorithm (e.g. `highs-hipo`), and its results are reported under its own name. Add it to `configurations` in [`config/solver_configurations.yaml`](config/solver_configurations.yaml); the header of the file describes its fields and the `{shared: <name>}` syntax for options, such as tolerances, that all configurations share.

## Adding an eligibility rule

Eligibility rules restrict which combinations of solver, year, problem size and problem class run, e.g. an algorithm that is only available from a certain version. Add a rule to `rules` in [`config/eligibility_rules.yaml`](config/eligibility_rules.yaml); the header of the file describes the fields and the comparison operators (`in`, `not_in`, `eq`, `gte`, `lte`).

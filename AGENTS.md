# AGENTS.md

Instructions for AI coding agents working on the Open Energy Benchmark. Human contributors should read [CONTRIBUTING.md](CONTRIBUTING.md).

## Project

The Open Energy Benchmark measures the performance of optimization solvers on problems from energy system models, and publishes the results on [openenergybenchmark.org](https://openenergybenchmark.org/). Each problem is an LP or MPS file, run with every eligible version of each solver (one per release year) on Google Cloud VMs. The Python code is managed with [pixi](https://pixi.sh); the website is a Next.js app.

## Layout

- `runner/`: the benchmark runner, run with `python -m runner.benchmark`.
  - `utils/`: the run loop (`orchestrator.py`), the solver dispatch (`solver.py`, which runs inside each solver's environment), the solver registry and eligibility rules (`config.py`), the solver environments (`env.py`), and campaign allocation and checks (`campaign.py`).
  - `utils/solvers/`: one adapter module per solver package, found by its file name.
  - `config/`: the data that drives the runner: `solvers.yaml` (versions, years and environments), `solver_configurations.yaml` (named ways of running a solver, and the default list), `eligibility_rules.yaml` (which solver, year, size and problem class combinations run).
  - `envs/benchmark-<solver>-<year>/`: one pixi manifest and lock file per solver version, outside the root workspace.
  - `tests/`: the pytest suite.
- `benchmarks/`: the metadata of the problems, one folder per modelling framework or source, with `metadata_schema.yaml`, the scripts that merge and categorize them, and the campaign generator (`create_benchmark_campaign.py`, documented in `CAMPAIGNS.md`).
- `results/`: `metadata.yaml`, generated from `benchmarks/` by `benchmarks/merge_metadata.py`, and the results of the published runs (`benchmark_results.csv`).
- `tests/`: the scripts that validate the metadata and results, and the sample problems that CI solves.
- `website/`: the Next.js website, which reads `results/`.
- `infrastructure/`: the OpenTofu configuration and startup script of the benchmark VMs.
- `notebooks/`: analysis notebooks; `archive/`: retired code, kept for reference and not linted.

## Commands

```bash
pixi install --all                                    # install the environments
pixi run -e runner pytest runner/tests                # run the tests
pixi run -e dev pre-commit run --all-files            # lint, format and check everything
pixi run -e benchmarks python benchmarks/merge_metadata.py   # after changing benchmarks/
pixi run -e benchmarks python tests/validate_urls.py         # rename URLs in the metadata to match the problem IDs (--dry-run only reports)
cd website && npm ci && npm run lint && npm run build        # if you changed the website
```

Run the tests and the pre-commit hooks before you finish: CI runs both, and only the jobs of the areas a change touches.

## Conventions

- Ruff formatting and linting, with lines of at most 88 characters and NumPy-style docstrings (enforced by Ruff's pydocstyle rules). Use `pathlib` for paths and time-zone-aware datetimes.
- Docstrings follow PEP 257 and numpydoc. Each file starts with a descriptive, concise, clear and simple docstring (or comment, for files that are not Python) that states what the module does and the data behind it. The docstring of each function, class and test states what it does, with the reasons and data facts that apply only to it in a Notes section. Inline comments are only for lines a reader would otherwise misread, such as an unusual timeout or a deliberately hidden error, never to explain ordinary behaviour or to repeat a docstring. Comments, docstrings and documentation describe the current code, with no history of changes and no comparisons with other code: those belong in commit messages and pull requests. Ruff checks the docstrings everywhere except in `runner/tests/`, `notebooks/` and the problem-generation code in `benchmarks/<framework>/` (see `ruff.toml`), so existing code there may have none; new code follows these rules there too.
- `runner/utils/solver.py`, `runner/utils/config.py` and `runner/utils/solvers/` also run inside the solver environments, some of which use Python 3.10: keep them compatible with it (`ruff.toml` sets their target version).
- Solver versions, configurations and eligibility rules are data in `runner/config/`: add or change entries there rather than code, as described in `runner/SOLVERS.md`.
- Edit the metadata of a problem in its file under `benchmarks/`, never `results/metadata.yaml`, and regenerate the latter with `merge_metadata.py`; CI checks that it is up to date and valid against `benchmarks/metadata_schema.yaml`.
- Running the runner writes to `results/benchmark_results.csv`: never commit the results of local runs.
- Change dependencies in the pixi manifests and run `pixi lock` (or `pixi install --manifest-path runner/envs/<env>` for a solver environment); never edit a `pixi.lock` by hand. For the website, change `website/package.json` and run `npm install`; never edit `package-lock.json` by hand. Dependabot updates the npm packages and the GitHub Actions, and pre-commit.ci the hooks.
- The website runs on Node.js 22 (`engines` in `website/package.json`), and its JavaScript and TypeScript are formatted by the Prettier hook of pre-commit.
- GitHub Actions are pinned to full commit SHAs with the version in a comment, check out code with `persist-credentials: false` and get only the permissions they need; actionlint and zizmor check this. The YAML files in `.github/` start with a comment that describes them.
- Never commit secrets, licence files (such as `gurobi.lic`), `.env` files or OpenTofu state; gitleaks scans every commit.
- Never launch cloud campaigns or run `tofu apply`: campaigns cost money and only maintainers launch them.

## pandas 3 pitfalls

- `to_numpy()` and `.values` can return read-only arrays (Copy-on-Write): create a new array instead of modifying it in place.
- Text columns have the `str` dtype, so assigning numbers into them fails: replace the whole column, e.g. `df[col] = pd.to_numeric(df[col])`.
- Chained assignment such as `df[col][mask] = value` never changes `df`: use `df.loc[mask, col] = value`.
- A DataFrame with MultiIndex columns needs a full tuple to add a column: `df[("std %", "")] = ...`.

## Adding benchmark problems or solvers

Follow the steps in [CONTRIBUTING.md](CONTRIBUTING.md#contributing-benchmark-problems) and [runner/SOLVERS.md](runner/SOLVERS.md). In particular:

- give each problem an ID of the form `<benchmark>-<spatial resolution>-<temporal resolution>` (see the top of `benchmarks/metadata_schema.yaml`), and run `tests/validate_urls.py`, which renames the files in the URLs to match;
- for a new solver package, add its pixi environments, its entry in `solvers.yaml`, an adapter in `runner/utils/solvers/<package>.py` (copy an existing one) and a `<package>-default` configuration.

## Pull requests

- Titles start with the area they change and describe it in the active voice, e.g. `Runner: add CPLEX support` or `Website: fix scrollbar on performance history page`. Pull requests are squash-merged, so the title becomes the commit message on `main`.
- Descriptions are short and clear: what changed and why, `Fixes #<issue>` if it closes one, and how it was tested.
- Keep pull requests focused, and say in the description which AI tools were used and for what.

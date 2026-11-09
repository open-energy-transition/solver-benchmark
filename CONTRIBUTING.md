# Contributing to the Open Energy Benchmark

Thank you for helping improve the [Open Energy Benchmark](https://openenergybenchmark.org/)! We welcome new benchmark problems, solver support, fixes to the runner and the website, tests and documentation. Issues labelled [good first issue](https://github.com/open-energy-transition/solver-benchmark/labels/good%20first%20issue) are a good place to start.

## Questions, bugs and ideas

- **Questions, bugs and feature requests**: [open an issue](https://github.com/open-energy-transition/solver-benchmark/issues/new).
- **Security vulnerabilities**: do not open a public issue; [report them privately](https://github.com/open-energy-transition/solver-benchmark/security/advisories/new).

For larger changes, please open an issue first so that we can agree on the approach before you invest time in it.

## Development setup

The repository has four parts: the benchmark runner (`runner/`), the benchmark problems and their metadata (`benchmarks/`, merged into `results/metadata.yaml`), the website (`website/`) and the cloud infrastructure (`infrastructure/`). The [README](README.md#project-structure) describes the layout.

The Python environments are managed by [pixi](https://pixi.sh) from the root `pixi.toml`: `runner`, `benchmarks`, `notebooks` and `dev`. Each solver version has its own environment in `runner/envs/benchmark-<solver>-<year>/`, which the runner installs when it needs it.

```bash
git clone https://github.com/<your-username>/solver-benchmark.git  # your fork
cd solver-benchmark
pixi install --all                       # or pixi install -e <environment>
pixi run -e dev pre-commit install       # run the hooks on every commit
```

The runner needs Linux, as it limits the memory of the solvers with `systemd-run`; on macOS and Windows, use the [Docker image](README.md#running-with-docker).

The website needs Node.js 22, the version in `engines` of `website/package.json`:

```bash
cd website
npm ci
npm run dev    # http://localhost:3000
```

## Making changes

1. Create a branch from `main` in your fork.
2. Follow the existing style: [Ruff](https://docs.astral.sh/ruff/) formatting and linting of Python (lines of at most 88 characters, NumPy-style docstrings), Prettier and ESLint for the website. The pre-commit hooks check this for you, and also validate the GitHub workflows and the Dependabot configuration, lint the workflows for security issues and scan for hardcoded secrets.
3. Write docstrings following [PEP 257](https://peps.python.org/pep-0257/) and [numpydoc](https://numpydoc.readthedocs.io/en/latest/format.html). Start each file with a descriptive, concise, clear and simple docstring (or comment, for files that are not Python) that states what the module does and the data behind it. The docstring of each function, class and test states what it does, with the reasons and data facts that apply only to it in a Notes section. Add inline comments only for lines a reader would otherwise misread, such as an unusual timeout or a deliberately hidden error, never to explain ordinary behaviour or to repeat a docstring. Comments, docstrings and documentation describe the current code, with no history of changes and no comparisons with other code: those belong in commit messages and pull requests.
4. Add or update tests in `runner/tests/` and run them:

   ```bash
   pixi run -e runner pytest runner/tests
   pixi run -e dev pre-commit run --all-files
   ```

5. Update the documentation if you change how something works: the README of the folder you change, [benchmarks/CAMPAIGNS.md](benchmarks/CAMPAIGNS.md) for campaigns, and [runner/SOLVERS.md](runner/SOLVERS.md) for solvers.

Running the benchmark locally writes to `results/benchmark_results.csv`: don't commit the results of local runs.

### Contributing benchmark problems

New problems from energy system models are the most valuable contribution. See [this page](https://openenergybenchmark.org/key-insights#what-benchmark-problems-do-we-have-and-what-are-missing) for the problems we have and the gaps we would love your help to fill, and the [benchmarks README](benchmarks/README.md) for the steps:

1. Generate an MPS file (preferred) or LP file of each problem with your modelling framework.
2. Describe each problem in a metadata YAML file in a new folder `benchmarks/<framework-or-source>/`, following [benchmarks/metadata_schema.yaml](benchmarks/metadata_schema.yaml), including the names of the benchmark and its size instance. Add a README with the steps to reproduce the problems from the framework's code.
3. Upload the files to any file-sharing service, and regenerate the merged metadata with `pixi run -e benchmarks python benchmarks/merge_metadata.py`: CI checks that `results/metadata.yaml` is up to date and valid.
4. Open a pull request. The benchmark team uploads the files to our storage, computes their size category and statistics, and checks that a solver solves them within our timeouts.

Benchmark problems are released under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license; the pull request template asks for your consent. Don't worry if you're not familiar with git or GitHub: open an issue or write to us, and we will help you through these steps.

### Adding or updating a solver

[runner/SOLVERS.md](runner/SOLVERS.md) describes how to update a solver version, add a new solver, a solver configuration or an eligibility rule. Solver versions, configurations and eligibility rules are data, in `runner/config/`: most changes need no Python code.

### Changing the website

Run `npm run lint` and `npm run build`, and check your change in the browser. CI also loads every page to check accessibility (WCAG 2 A and AA), the Content Security Policy and the rendering of formulas; `npm run axe:full` and `npm run check:pages` run these checks locally (see [website/README.md](website/README.md)).

### Running benchmark campaigns in the cloud

Only maintainers launch campaigns on Google Cloud, as they cost money. See [benchmarks/CAMPAIGNS.md](benchmarks/CAMPAIGNS.md) and [infrastructure/README.md](infrastructure/README.md).

## Pull requests

### Titles

Pull requests are squash-merged, and their title becomes the commit message on `main`. Start the title with the area it changes, followed by a short description in the active voice, for example:

- `Benchmarks: add TIMES instances`
- `Runner: support Linopy solver initialization APIs`
- `Website: fix scrollbar on performance history page`

Common areas are `Benchmarks`, `Runner`, `Website`, `Infrastructure`, `Campaigns`, `CI` and `Docs`.

### Description

Fill in the pull request template: what the change does and why, `Fixes #<issue>` if it closes an issue, and how you tested it. Keep it short and clear, and keep pull requests focused: several small ones are easier to review than a large one.

### Review

Every pull request needs an approval from a [code owner](.github/CODEOWNERS), the maintainers team. Before it is merged, the `CI` check and CodeQL must pass, and every review conversation must be resolved. CI runs only the jobs for the areas your change touches: linting, the metadata checks, the runner tests and sample benchmarks, and the website build and page checks. Labels are added automatically from the files you change.

Dependabot proposes updates of the website's npm packages and of the GitHub Actions every week, and pre-commit.ci updates the pre-commit hooks, so you don't need to update these by hand.

## AI-assisted contributions

You may use AI tools to help with your contribution, provided that:

- you say so in the pull request description (which tool, and for what);
- you have reviewed, understood and tested every change, and can explain it during review.

Please don't open pull requests or issues generated by AI tools without your own review. [AGENTS.md](AGENTS.md) gives AI coding agents the conventions of this repository.

## License

By contributing, you agree that your code is licensed under the project's [AGPL-3.0 license](LICENSE), and that the benchmark problems you contribute are released under the CC BY 4.0 license.

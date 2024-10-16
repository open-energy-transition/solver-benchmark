# Solver Benchmark Website

This repository contains code for benchmarking LP/MILP solvers, and an interactive website for analyzing the results.

## Initial Setup

Before you begin, make sure your development environment includes [Python](https://www.python.org/).

Preferred use:
- python: 3.12.4
- pip: 24.1.2

We use Python virtual environments to manage the dependencies for each component of this project. This is how to create a virtual environment:
```shell
python -m venv venv
```
This is how to activate one:
- Windows
   ```cmd
   .\venv\Scripts\activate
   ```
- Linux/MacOS
   ```shell
   source venv/bin/activate
   ```
And this is how to install the required dependencies once a `venv` is activated:
- Benchmark Runner:
   ```shell
   sudo apt install glpk-utils libglpk-dev  # GLPK solver cannot be installed purely with pip
   pip install -r runner/requirements.txt
   ```
- Website:
   ```shell
   pip install -r website/requirements.txt
   ```

## Run Custom Linopy by Daniel-RDT
#### TODO: Remove this section once the pull request for linopy_solver_class by Daniel-RDT is merged into the main Linopy repository.
### Install Custom Linopy by Daniel-RDT
```shell
pip install git+https://github.com/daniel-rdt/linopy.git@linopy_solver_class
```

### Development

We use the [ruff](https://docs.astral.sh/ruff) code linter and formatter, and GitHub Actions runs various pre-commit checks to ensure code and files are clean.

You can install a git pre-commit that will ensure that your changes are formatted
and no lint issues are detected before creating new commits:
```bash
pip install pre-commit
pre-commit install
```
If you want to skip these pre-commit steps for a particular commit, you can run:
```bash
git commit --no-verify
```

## Run Project

Remember to activate the appropriate virtual environment before running the runner or the website.

1. **Run Benchmark Runner**
   ```shell
   python runner/run_benchmarks.py
   ```

   The app will save the runtime and memory consumption into a CSV file.

1. **Run Website**
   ```shell
   streamlit run website/app.py
   ```
   The website will be running on: [http://localhost:8501](http://localhost:8501)

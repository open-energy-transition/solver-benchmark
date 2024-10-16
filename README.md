# Solver Benchmark Website

This repository contains code for benchmarking LP/MILP solvers, and an interactive website for analyzing the results.


## Run Custom Linopy by Daniel-RDT
#### TODO: Remove this section once the pull request for linopy_solver_class by Daniel-RDT is merged into the main Linopy repository.
### Install micromamba
1. Update your system and install bzip2:
   ```shell
      sudo apt update
      sudo apt install bzip2 -y
   ```
2. Download and install Micromamba:
   ```shell
      curl -Ls https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xvj bin/micromamba
      sudo mv bin/micromamba /usr/local/bin/
   ```

### Install Git and Custom Linopy by Daniel-RDT
1. Install Git using Micromamba:
   ```shell
      micromamba install -n base -c conda-forge git -y
   ```
2. Clone and install the custom version of Linopy:
   ```shell
      git clone https://github.com/daniel-rdt/linopy
      cd linopy
      git checkout linopy_solver_class
      pip install -e . --no-deps
   ```
Note: When using the custom Linopy version, use `runner/requirements_custom_linopy.txt` instead of `runner/requirements.txt` for installing dependencies.

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

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
- Website:
   ```shell
   pip install -r website/requirements.txt
   ```

We also use the `conda` package manager to manage different solver versions, so please make sure it is installed before running the benchmark runner.

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

1. **Run Benchmark Runner**
   The benchmark runner script creates conda environments containing the solvers and other necessary pre-requisites, so a virtual environment is not necessary.
   ```shell
   ./runner/benchmark_all.sh ./benchmarks/benchmark_config.yaml
   ```
   The script will save the measured runtime and memory consumption into a CSV file in `results/` that the website will then read and display.
   The script has other options that you can see with the `-h` flag.

   *Note: If you encounter a "permission denied" error, make sure to set the script as executable by running:*
   ```shell
   chmod +x ./runner/benchmark_all.sh
   ```

1. **Run Website**
   Remember to activate the virtual environment containing the website's requirements, and then run:
   ```shell
   streamlit run website/app.py
   ```
   The website will be running on: [http://localhost:8501](http://localhost:8501)

1. **Merge Metadata**
   Run the script to generate a unified metadata.yaml file by executing:
   ```shell
   python benchmarks/merge_metadata.py
   ```
   This will parse all metadata*.yaml files under benchmarks/ and create results/metadata.yaml, containing metadata for all benchmarks.

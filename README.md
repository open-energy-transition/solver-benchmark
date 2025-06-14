# Solver Benchmark Website

This repository contains code for benchmarking solvers on LP/MILP problems from the energy planning domain, and an interactive website for analyzing the results.

## Initial Setup

Before you begin, make sure your development environment includes [Python](https://www.python.org/).

Preferred use:
- python: 3.12.4
- pip: 24.1.2

We use Python virtual environments to manage the dependencies for the website. This is how to create a virtual environment:
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

We also use the `conda` package manager to run benchmarks using different solver versions, so please make sure it is installed before running the benchmark runner.

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

## Generating / Fetching Benchmarks

1. The PyPSA benchmarks in `benchmarks/pypsa/` can be generated by using the Dockerfile present in that directory. Please see the [instructions](benchmarks/pypsa/README.md) for more details.

1. The JuMP-HiGHS benchmarks in `benchmarks/jump_highs_platform/` contain only the metadata for the benchmarks that are present in https://github.com/jump-dev/open-energy-modeling-benchmarks/tree/main/instances. These are fetched automatically by the benchmark runner from GitHub.

1. The metadata of all benchmarks under `benchmarks/` are collected by the following script to generate a unified `results/metadata.yaml` file, when run as follows:
   ```shell
   python benchmarks/merge_metadata.py
   ```

1. The file `benchmarks/benchmark_config.yaml` specifies the names, sizes (instances), and URLs of the LP/MPS files for each benchmark. This is used by the benchmark runner.

## Running Benchmarks

The benchmark runner script creates conda environments containing the solvers and other necessary pre-requisites, so a virtual environment is not necessary.
```shell
./runner/benchmark_all.sh ./benchmarks/benchmark_config.yaml
```
The script will save the measured runtime and memory consumption into a CSV file in `results/` that the website will then read and display.
The script has options, e.g. to run only particular years, that you can see with the `-h` flag:
```
Usage: ./runner/benchmark_all.sh [-a] [-y "<space separated years>"] <benchmarks yaml file>
Runs the solvers from the specified years (default all) on the benchmarks in the given file
Options:
    -a    Append to the results CSV file instead of overwriting. Default: overwrite
    -y    A space separated string of years to run. Default: 2020 2021 2022 2023 2024
```

The `benchmark_all.sh` script activates the appropriate conda environment and then calls `python runner/run_benchmarks.py`.
This script can also be called directly, if required, but you must be in a conda environment that contains the solvers you want to benchmark.
For example:
```shell
python runner/run_benchmarks.py benchmarks/benchmark_config.yaml 2024
```

### Solver Versions

We support the following versions of solvers: (We use the last released solver version in each calendar year.)

| Solver | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
| ------ | ---- | ---- | ---- | ---- | ---- | ---- |
| HiGHS | | [Not on PyPI](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L16) | 1.5.0 | 1.6.0 | 1.9.0 | 1.10.0 |
| SCIP | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L13) | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L12) | 8.0.3 | 8.1.0 | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/main/runner/envs/benchmark-2024.yaml) | 9.2.2 |
| CBC | [Bug](https://github.com/coin-or/Cbc/issues/708) | | [Bug](https://github.com/coin-or/Cbc/issues/708) | 2.10.11 | 2.10.12 | |
| GLPK | 5.0.0 |  |  |  |  |  |
| Gurobi | [Incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L16) | [Incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L14) | 10.0.0 | 11.0.0 | 12.0.0 | |


When determining which is the most recent version released in a particular year, we use the following resources:
- https://github.com/ERGO-Code/HiGHS/releases
- https://github.com/coin-or/Cbc/releases
- https://github.com/scipopt/scip/releases and https://pypi.org/project/PySCIPOpt/#history
- https://support.gurobi.com/hc/en-us/articles/360048138771-Gurobi-release-and-support-history

## Running the Website

### Using Streamlit

Remember to activate the virtual environment containing the website's requirements, and then run:
```shell
streamlit run website/app.py
```
The website will be running on: [http://localhost:8501](http://localhost:8501)

### Using Docker

#### Build the Docker Image

```shell
docker build -t benchmark-website-snapshot .
```

#### Run the Docker Container

```shell
docker run -p 8501:8501 benchmark-website-snapshot
```

#### Save the Image as a .tar File

```shell
docker save -o benchmark-website-snapshot.tar benchmark-website-snapshot
```

#### Load and Run the Docker Image

- **Load the Image:**

  ```shell
  docker load < benchmark-website-snapshot.tar
  ```

- **Run the Docker Container:**

  ```shell
  docker run -p 8501:8501 benchmark-website-snapshot
  ```

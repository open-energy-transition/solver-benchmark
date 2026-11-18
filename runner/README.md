# Benchmark runner

The runner solves a set of benchmark problems with each requested solver configuration and solver version, and records the runtime, memory use, status and objective of each run in `results/benchmark_results.csv`.

## Environments

The runner itself runs in the `runner` pixi environment of the root `pixi.toml`. Each solver version runs in its own pixi environment, `envs/benchmark-<solver>-<year>/`, with its own manifest and lock file. The runner installs the environments a run needs, so no setup is needed beyond [pixi](https://pixi.sh). [SOLVERS.md](SOLVERS.md) lists the solver versions and describes how to add one.

## Running benchmarks

Run `runner.benchmark` from the repository root, with a YAML file of problems, such as `results/metadata.yaml` or a file in the [benchmark YAML format](../infrastructure/README.md#benchmark-yaml-format).

```bash
pixi run -e runner python -m runner.benchmark [OPTIONS] PROBLEMS_YAML_PATH
```

| Option | Description |
|---|---|
| `-y, --years YEAR` | Solver-version year to run (repeatable), or `tests` for the environment that CI uses. Default: every year with a registered solver version. |
| `-s, --solver-configurations CONFIG` | Solver configuration to run (repeatable), e.g. `highs-default` or `highs-hipo`. Default: `default_configurations` in `config/solver_configurations.yaml`. |
| `-a, --append` | Append to the results files instead of overwriting them. |
| `-n, --num-seeds N` | Number of seeds per problem and configuration (default 1). Above 1, each repetition uses seed 1, 2, 3, ... instead of the configuration's own seed, to measure the solver's sensitivity to it. Each seed's row goes to `results/benchmark_results_seeds.csv`, and `results/benchmark_results.csv` gets one row per problem and configuration, with the mean runtime and memory, and the status, objective and other values of the last seed. |
| `-r, --ref-bench-interval SECONDS` | Run the reference benchmark at most once every N seconds (default 0, off). |
| `-u, --run-id RUN_ID` | Identifier written in every row of this run. Default: generated from the time and host name. |

The runner only runs the combinations of solver, year, problem size and problem class allowed by `config/eligibility_rules.yaml`. It runs all years and configurations on one problem, in a random order, before moving to the next problem, so that a slow drift in the speed of the machine doesn't favour the solvers that would always run first. Before solving, it checks that each environment runs the registered solver version, and skips a year with an `ER` alert if it doesn't.

The reference benchmark solves a fixed problem with a HiGHS binary, to compare the speed of different machines. Only the benchmark VMs install the binary, and they run it once an hour (see `reference_benchmark_interval` in [infrastructure/README.md](../infrastructure/README.md#variables)).

Examples:

```bash
# HiGHS and SCIP 2025 on the sample problems, added to the existing results
pixi run -e runner python -m runner.benchmark --append --years 2025 \
  --solver-configurations highs-default --solver-configurations scip-default \
  infrastructure/benchmarks/sample_run/standard-00.yaml

# Every default configuration on every problem on the website, for 2025
pixi run -e runner python -m runner.benchmark --years 2025 results/metadata.yaml

# Three seeds per problem and configuration
pixi run -e runner python -m runner.benchmark --num-seeds 3 --years 2025 \
  infrastructure/benchmarks/sample_run/standard-00.yaml
```

The runner downloads the problems to `runner/benchmarks/`, and writes the solver logs to `runner/logs/` and the solutions to `runner/solutions/`.

## Running one solver on one problem

To debug a solver, run `runner.utils.solver` in the solver's environment, from the repository root:

```bash
pixi run --manifest-path runner/envs/<env> python -m runner.utils.solver \
  <solver_configuration> <problem_file> <solver_version> [--seed N] [--timeout SECONDS]
```

- `solver_configuration`: e.g. `highs-default` or `highs-hipo`.
- `problem_file`: an LP or MPS file.
- `solver_version`: the version, used in the names of the output files and in the metrics.
- `--seed N`: replaces the configuration's own seed.
- `--timeout SECONDS`: sets the solver's time limit, for the solvers with an entry in `timeout_options` of `config/solvers.yaml`.

For example:

```bash
pixi run --manifest-path runner/envs/benchmark-highs-2025 python -m runner.utils.solver \
  highs-default tests/sample_benchmarks/sample_lp.lp 1.12.0
```

It prints the metrics as JSON (status, runtime, objective and others), and writes the log to `runner/logs/` and the solution to `runner/solutions/`.

## Running with Docker

On macOS and Windows, or without systemd, run the runner in Docker. The container can't limit the memory of the solvers with `systemd-run`: a solver that uses too much memory is stopped by the kernel instead. For the published results, we run the runner directly on Linux.

Build the image from the repository root:

```bash
docker build -t solver-benchmark-runner -f runner/Dockerfile .
```

The container runs `runner.benchmark` and takes the same arguments. Mount `results/` to get the results on the host, and a named volume on pixi's package cache (`/opt/pixi-cache`) to keep the solver packages between runs:

```bash
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-pixi-cache:/opt/pixi-cache \
  solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
```

Don't mount a volume on `runner/envs/`: it would hide the manifests and lock files copied into the image.

Gurobi needs a license file:

```bash
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-pixi-cache:/opt/pixi-cache \
  -v $HOME/gurobi.lic:/opt/gurobi/gurobi.lic:ro \
  -e GRB_LICENSE_FILE=/opt/gurobi/gurobi.lic \
  solver-benchmark-runner --solver-configurations gurobi-default --years 2025 results/metadata.yaml
```

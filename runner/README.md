# Benchmark Runner

This folder contains the scripts used to benchmark various solvers.

## Environment Structure

The orchestration tooling itself (this folder's own dependencies, e.g. `pyyaml`,
`pandas`, `psutil`, `requests`) is managed by the `runner` [pixi](https://pixi.sh)
environment defined in the root `pixi.toml` — install it with `pixi install -e runner`.
This is separate from the per-solver-year environments described below, which each
solver actually runs in.

Each solver-version pair has its own pixi environment (e.g., `benchmark-highs-2025`, `benchmark-scip-2025`), enabling running solvers independently.

### `solvers.yaml` — Solver Registry

The source of truth for mapping solver names to version, release year, and env is `runner/config/solvers.yaml`

Example:
```yaml
solvers:
  highs:
    "1.12.0":
      year: 2025
      env: benchmark-highs-2025
```

### Per-solver Environment Manifests

Each solver-version pair has its own **self-contained pixi manifest** at `runner/envs/<env>/pixi.toml`, with its own `pixi.lock` (not part of the root workspace). Unlike the root `pixi.toml`, these aren't installed up front -- `runner.benchmark` installs whichever ones a given run actually needs, on demand (see [Updating Solver Versions](SOLVERS.md#updating-solver-versions) for how to add or change one).

## Running runner.benchmark

`runner/benchmark.py` is a Typer CLI that takes a YAML file of problems and runs each requested solver configuration against it, for one or more solver-version years. It installs any missing per-solver-year envs automatically (see `runner/envs/`), so no manual env setup is needed first. Since it's a package module (not a standalone script), run it with `-m` **from the repo root**, not from `runner/`:

```shell
$ pixi run -e runner python -m runner.benchmark --help
Usage: python -m runner.benchmark [OPTIONS] {problems_yaml_path}

Run every problem in PROBLEMS_YAML_PATH against each solver configuration,
once per given year.
```

**Required Arguments:**
- `problems_yaml_path` - Path to the problems YAML file

**Optional Arguments:**
- `-a, --append` - Append to the results CSVs instead of overwriting them for the first year
- `-y, --years YEAR` - Solver-version year to run (repeatable), or `tests` for the shared CI smoke-test env. Defaults to every year with a registered solver version
- `-s, --solver-configurations CONFIG` - Solver configuration to run (repeatable), e.g. `highs-default` or `highs-hipo`. Defaults to `solver_configurations.yaml`'s `default_configurations`
- `-n, --num-seeds N` - Number of seeds to try per (problem, solver configuration) pair. When greater than 1, each repetition uses a different seed (1, 2, 3, ...) instead of the configuration's own fixed seed, to gauge the solver's sensitivity to it. Default: 1 (no repetition, the configuration's own fixed seed applies)
- `-r, --ref-bench-interval SECONDS` - Run a reference benchmark at most once every N seconds. 0 disables it
- `-u, --run-id RUN_ID` - Identifier shared by every row from this run. Auto-generated if not given
- `--help` - Show this message and exit

Usage examples:

1. Add results to the results CSV files instead of overwriting them:
```shell
pixi run -e runner python -m runner.benchmark --append --years 2025 --run-id "local-run" benchmarks/sample_run/standard-00.yaml
```

2. Run specific solver configurations by repeating the `-s`/`--solver-configurations` flag:
```shell
pixi run -e runner python -m runner.benchmark --solver-configurations highs-default --solver-configurations scip-default --years 2025 benchmarks/sample_run/standard-00.yaml
```

3. Full run for the entire website problem set for 2025:

```shell
pixi run -e runner python -m runner.benchmark --years 2025 results/metadata.yaml
```

4. Run each problem 3 times per solver configuration, under 3 different seeds, to gauge runtime sensitivity to the seed:
```shell
pixi run -e runner python -m runner.benchmark --num-seeds 3 --years 2025 benchmarks/sample_run/standard-00.yaml
```

## Running with Docker

Docker is optional. On native Linux with systemd, you can run the scripts directly (see above). Memory limit enforcement via `systemd-run` is skipped automatically when systemd is not available.

### Build

```sh
docker build -t solver-benchmark-runner -f runner/Dockerfile .
```

### Run

The container entrypoint runs `runner.benchmark`, so pass the same flags you would use natively. Mount `results/` to get output on the host:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
```

### Caching pixi environments

Per-solver-year pixi environments are installed at runtime. To avoid recreating them on every run, mount a named Docker volume over `runner/envs/`:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-pixi-envs:/solver-benchmark/runner/envs \
  solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
```

### Gurobi licensing

Gurobi requires a license file. Mount it into the container:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-pixi-envs:/solver-benchmark/runner/envs \
  -v $HOME/gurobi.lic:/opt/gurobi/gurobi.lic:ro \
  -e GRB_LICENSE_FILE=/opt/gurobi/gurobi.lic \
  solver-benchmark-runner --solver-configurations gurobi-default --years 2025 results/metadata.yaml
```

### Limitations

- **No memory limit enforcement**: `systemd-run` is not available inside Docker, so OOM protection is skipped. Solvers that exceed available memory will be killed by the kernel OOM killer instead.
- **Performance overhead**: Docker adds minimal overhead, but for official benchmark submissions native Linux is recommended.

## Running a single solver (`runner.utils.solver`)

Use `runner.utils.solver` to test a single solver on a single problem. This is useful for debugging. Since it's a package module (not a standalone script), run it with `-m` **from the repo root**, not from `runner/`:

```bash
python -m runner.utils.solver <solver_configuration> <input_file> <solver_version> [--seed N]
```

**Arguments:**
- `solver_configuration` - Solver configuration name (e.g., highs-default, highs-hipo, scip-default)
- `input_file` - Path to a problem file (.lp or .mps)
- `solver_version` - Solver version string (e.g., 1.10.0)
- `--seed N` - Optional. Overrides the configuration's own fixed seed (see `runner/config/solvers.yaml`'s `seed_options`)

**Examples:**

```bash
# Test HiGHS (from the repo root)
pixi run --manifest-path runner/envs/benchmark-highs-2024 python -m runner.utils.solver highs-default runner/benchmarks/pypsa-eur-elec-op-2-1h.lp 1.10.0

# Test SCIP
pixi run --manifest-path runner/envs/benchmark-scip-2024 python -m runner.utils.solver scip-default runner/benchmarks/pypsa-eur-elec-op-2-1h.lp 9.2.2

# Test HiGHS with a specific seed instead of highs-default's own fixed one
pixi run --manifest-path runner/envs/benchmark-highs-2024 python -m runner.utils.solver highs-default runner/benchmarks/pypsa-eur-elec-op-2-1h.lp 1.10.0 --seed 7
```

**Output:**
- Solution files are saved to `runner/solutions/`
- Detailed logs are saved to `runner/logs/`
- JSON metrics are printed to stdout (runtime, status, objective value, etc.)

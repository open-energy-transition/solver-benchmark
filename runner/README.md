# Benchmark Runner

This folder contains the scripts used to benchmark various solvers.

## Environment Structure

The orchestration tooling itself (this folder's own dependencies, e.g. `pyyaml`,
`pandas`, `psutil`, `requests`) is managed by the `runner` [pixi](https://pixi.sh)
environment defined in the root `pixi.toml` — install it with `pixi install -e runner`.
This is separate from the per-solver-year conda environments described below, which
each solver actually runs in.

Each solver-version pair has its own conda environment (e.g., `benchmark-highs-2025`, `benchmark-scip-2025`), enabling running solvers independently.

### `solvers.yaml` — Solver Registry

The source of truth for mapping solver names to version, release year, and conda env is `runner/config/solvers.yaml`

Example:
```yaml
solvers:
  highs:
    "1.12.0":
      year: 2025
      env: benchmark-highs-2025
```

### Per-solver Environment Files

Environment YAML files live in `runner/envs/`:

- **Loose YAMLs** (`benchmark-{solver}-{year}.yaml`) — flexible dependency specs for development
- **Fixed YAMLs** (`benchmark-{solver}-{year}-fixed.yaml`) — pinned versions for reproducibility

To regenerate fixed YAMLs from loose ones on native Linux: `./runner/envs/generate_fixed_envs.sh`. For other platforms, see [Generating Fixed Environment Files](#generating-fixed-environment-files).

## Running runner.benchmark

`runner/benchmark.py` is a Typer CLI that takes a YAML file of problems and runs each requested solver configuration against it, for one or more solver-version years. It creates any missing per-solver-year conda envs automatically (see `runner/envs/`), so no manual env setup is needed first. Since it's a package module (not a standalone script), run it with `-m` **from the repo root**, not from `runner/`:

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

### Caching conda environments

Per-solver-year conda environments are created at runtime. To avoid recreating them on every run, mount a named Docker volume:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-conda-envs:/opt/conda/envs \
  solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
```

### Gurobi licensing

Gurobi requires a license file. Mount it into the container:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-conda-envs:/opt/conda/envs \
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
python -m runner.utils.solver <solver_configuration> <input_file> <solver_version>
```

**Arguments:**
- `solver_configuration` - Solver configuration name (e.g., highs-default, highs-hipo, scip-default)
- `input_file` - Path to a problem file (.lp or .mps)
- `solver_version` - Solver version string (e.g., 1.10.0)

**Examples:**

```bash
# Test HiGHS (from the repo root)
conda activate benchmark-highs-2024
python -m runner.utils.solver highs-default runner/benchmarks/pypsa-eur-elec-op-2-1h.lp 1.10.0

# Test SCIP
conda activate benchmark-scip-2024
python -m runner.utils.solver scip-default runner/benchmarks/pypsa-eur-elec-op-2-1h.lp 9.2.2
```

**Output:**
- Solution files are saved to `runner/solutions/`
- Detailed logs are saved to `runner/logs/`
- JSON metrics are printed to stdout (runtime, status, objective value, etc.)

## Generating Fixed Environment Files

Fixed YAMLs pin exact dependency versions for reproducibility. To regenerate them from loose YAMLs, use native Linux or Docker:

On native Linux you can also run the script directly: `./runner/envs/generate_fixed_envs.sh`

```bash
docker run -v $(pwd):/work -w /work continuumio/miniconda3 bash runner/envs/generate_fixed_envs.sh
```

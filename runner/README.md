# Benchmark Runner

This folder contains the scripts used to benchmark various solvers.

## Environment Structure

Each solver-version pair has its own conda environment (e.g., `benchmark-highs-2025`, `benchmark-scip-2025`), enabling running solvers independently.

### `solvers.yaml` — Solver Registry

The source of truth for mapping solver names to version, release year, and conda env is `runner/solvers.yaml`

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

## Running benchmark_all.sh

The `benchmark_all.sh` script takes a YAML benchmark config file as argument and runs all the solvers in series for each benchmark problem. It creates per-solver conda environments automatically.

The script has options, e.g. to run only particular years, that you can see with the `-h` flag:

```shell
$./runner/benchmark_all.sh -h
Runs the solvers from the specified years (default all) on the benchmarks in the given file
Options:
    -a    Append to the results CSV file instead of overwriting. Default: overwrite
    -y    A space separated string of years to run. Default: 2020 2021 2022 2023 2024 2025
    -r    Reference benchmark interval in seconds. Default: 0 (disabled)
    -u    Unique run ID to identify this benchmark run. Default: auto-generated
    -s    Space separated list of solvers to run. Default: year-specific default
```

Usage examples:

1. Add results to the results CSV file by running the script with the `-a`
```shell
./runner/benchmark_all.sh -a -y "2025" -u "local-run" benchmarks/sample_run/standard-00.yaml
```

2. Run specific solvers by passing the `-s` flag with a space separated list of solver names.
```shell
./runner/benchmark_all.sh -s "highs scip" -y "2025" benchmarks/sample_run/standard-00.yaml
```

3. Full run for the entire website benchmarks set for 2025

```sh
./runner/benchmark_all.sh -y "2025" results/metadata.yaml
```

## Running with Docker

Docker is optional. On native Linux with systemd, you can run the scripts directly (see above). Memory limit enforcement via `systemd-run` is skipped automatically when systemd is not available.

### Build

```sh
docker build -t solver-benchmark-runner -f runner/Dockerfile .
```

### Run

The container entrypoint is `benchmark_all.sh`, so pass the same flags you would use natively. Mount `results/` to get output on the host:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  solver-benchmark-runner -s "highs" -y "2025" results/metadata.yaml
```

### Caching conda environments

Conda environments are created at runtime. To avoid recreating them on every run, mount a named Docker volume:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-conda-envs:/opt/conda/envs \
  solver-benchmark-runner -s "highs" -y "2025" results/metadata.yaml
```

### Gurobi licensing

Gurobi requires a license file. Mount it into the container:

```sh
docker run --rm \
  -v $(pwd)/results:/solver-benchmark/results \
  -v solver-conda-envs:/opt/conda/envs \
  -v $HOME/gurobi.lic:/opt/gurobi/gurobi.lic:ro \
  -e GRB_LICENSE_FILE=/opt/gurobi/gurobi.lic \
  solver-benchmark-runner -s "gurobi" -y "2025" results/metadata.yaml
```

### Limitations

- **No memory limit enforcement**: `systemd-run` is not available inside Docker, so OOM protection is skipped. Solvers that exceed available memory will be killed by the kernel OOM killer instead.
- **HiGHS-HiPO**: The HiPO solver variant requires a custom build and is not available in the Docker image.
- **Performance overhead**: Docker adds minimal overhead, but for official benchmark submissions native Linux is recommended.

## Running run_benchmarks.py

Use `run_benchmarks.py` to run benchmarks for a specific year with more control. Solver versions are looked up from `solvers.yaml` and each solver runs in its own conda env automatically. You need to create the per-solver conda environments first and activate any one of them (the script switches envs per solver internally).

```sh
# Create the per-solver envs for a year
conda env create -q -f ./runner/envs/benchmark-highs-2025-fixed.yaml -y
conda env create -q -f ./runner/envs/benchmark-scip-2025-fixed.yaml -y
```

```sh
conda activate benchmark-highs-2025
python run_benchmarks.py <benchmark_yaml> <year> [OPTIONS]
```

**Required Arguments:**
- `benchmark_yaml` - Path to benchmark configuration file (e.g., `../results/metadata.yaml`)
- `year` - Solver release year (2020-2025)

**Optional Arguments:**
- `-a, --append` - Append to CSV results instead of overwriting
- `--solvers SOLVERS` - Space-separated list of solvers to run
- `--ref_bench_interval SECONDS` - Run reference benchmark every N seconds - This is not supported for local runs yet
- `--run_id RUN_ID` - Custom identifier for this benchmark run
- `-h, --help` - Show help message

**Examples:**

```bash
# Run HiGHS only for 2025
conda activate benchmark-highs-2025
python run_benchmarks.py ../results/metadata.yaml 2025 --solvers highs

# Run multiple solvers for 2024 and append results
conda activate benchmark-highs-2024
python run_benchmarks.py ../results/metadata.yaml 2024 --solvers "highs scip cbc" -a

# Run with custom run ID for tracking
python run_benchmarks.py ../results/metadata.yaml 2024 --run_id "debug-run-001"
```

## Running run_solver.py

Use `run_solver.py` to test a single solver on a single benchmark problem. This is useful for debugging:

```bash
python run_solver.py <solver_name> <input_file> <solver_version>
```

**Arguments:**
- `solver_name` - Solver name (highs, scip, cbc, gurobi, glpk)
- `input_file` - Path to benchmark problem file (.lp or .mps)
- `solver_version` - Solver version string (e.g., 1.10.0)

**Examples:**

```bash
# Test HiGHS
conda activate benchmark-highs-2024
python run_solver.py highs ./benchmarks/pypsa-eur-elec-op-2-1h.lp 1.10.0

# Test SCIP
conda activate benchmark-scip-2024
python run_solver.py scip ./benchmarks/pypsa-eur-elec-op-2-1h.lp 9.2.2
```

**Output:**
- Solution files are saved to `solutions/`
- Detailed logs are saved to `logs/`
- JSON metrics are printed to stdout (runtime, status, objective value, etc.)

## Generating Fixed Environment Files

Fixed YAMLs pin exact dependency versions for reproducibility. To regenerate them from loose YAMLs, use native Linux or Docker:

On native Linux you can also run the script directly: `./runner/envs/generate_fixed_envs.sh`

```bash
docker run -v $(pwd):/work -w /work continuumio/miniconda3 bash runner/envs/generate_fixed_envs.sh
```


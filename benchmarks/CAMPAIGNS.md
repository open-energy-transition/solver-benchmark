# Benchmark Campaign Creation

This repository contains tooling to create benchmark campaigns from the problem metadata.

Campaigns can target either:

- cloud execution using Google Cloud Platform VMs (currently allowed to maintainers only);
- local execution using the existing benchmark runner workflow.

The main entry point is:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py
```

The script prepares problem metadata, selects problems, and creates
either:

- a cloud campaign under `infrastructure/benchmarks/<run-id>/`; or
- a local campaign under `infrastructure/local/benchmarks/<run-id>/`.

## Execution targets

The campaign generator supports two execution targets:

| Target | Description |
|----------|-------------|
| `cloud` | Generates OpenTofu VM configuration files under `infrastructure/benchmarks/<run-id>/`. |
| `local` | Generates local run files under `infrastructure/local/benchmarks/<run-id>/`. |

The default target is:

```text
cloud
```

Override it with:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --target local
```

to launch a benchmark campaign on your local machine.

## Basic usage

Create a campaign for all problems (please do this very carefully, especially if running on the cloud):

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign my-test \
  --all
```

This creates a run ID of the form:

```text
YYYYMMDD-my-test
```

## Configuration files

Campaigns can also be defined through a YAML configuration file.

A complete template is provided in:

```text
benchmarks/config.campaign.default.yaml
```

Run a campaign directly from a configuration file:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --configfile benchmarks/config.campaign.default.yaml
```

Command-line arguments always override values defined in the configuration file.

For example:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --configfile benchmarks/config.campaign.default.yaml \
  --campaign my-test \
  --timeout-hours 6
```

## Select problems

Select one or more problems by their exact `results/metadata.yaml` ID:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign pypsa-eur-test \
  --problem pypsa-de-elec-2-1h pypsa-de-elec-4-1h
```

Select problems by size class:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign pypsa-eur-small-medium \
  --all \
  --size S M
```

Combine a problem list with a size filter:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign pypsa-eur-filtered \
  --problem pypsa-de-elec-2-1h pypsa-de-elec-4-1h \
  --size S M
```

Include metadata entries marked as skipped (due to known timeout or memory issues):

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign clean-test \
  --all \
  --do-not-skip
```

## Cloud VM allocation

This section only applies to cloud campaigns.

By default, the script creates one VM per selected problem.

Use a custom number of VMs with:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign packed-test \
  --all \
  --num-vms 5
```

## Cloud machine settings

By default, problems are assigned to VM profiles automatically based on their metadata size class:

| Size class | Machine profile | GCP machine type | Timeout |
| ---------- | --------------- | ---------------- | -------- |
| S, M | short | c4-standard-2 | 1 hour |
| L | long | c4-highmem-16 | 24 hours |

Default zone:

```text
us-central1-a
```

When `--machine-type` is specified, all selected problems use the chosen profile regardless of their size classification.

## Timeout policy

If no timeout is provided, the script applies the default timeout policy:

```text
S/M problems: 1 hour
L problems:   24 hours
```

Override the timeout:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign timeout-test \
  --all \
  --timeout-hours 6
```

## Solver and year selection

By default, the generated VM YAML files run all the following solver configurations:

```text
gurobi-default highs-default scip-default cbc-default glpk-default
```

The default solver year is:

```text
2025
```

Each solver configuration runs in its own per-solver-year pixi env, e.g. for `highs-default` in 2025:

```text
benchmark-highs-2025
```

See `runner/config/solvers.yaml` for the full registry, and `runner/config/solver_configurations.yaml`
for the available named configurations (e.g. `highs-hipo`).

Run specific solvers for one or more years:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign year-test \
  --all \
  --solver-configurations cbc-default highs-default \
  --years 2024 2025
```

## Campaign summary

Every generated campaign includes a:

```text
campaign_summary.csv
```

containing the problem selection, campaign configuration, solver selection,
timeout settings, allocation decisions, and metadata used to create the campaign.

## Existing campaign directories

The script fails if the target campaign directory already exists.

Use a different campaign name, remove the existing directory, or overwrite it:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign my-test \
  --all \
  --force
```

## Launching a cloud campaign

After reviewing the generated files, launch the campaign from the infrastructure directory:

```bash
cd infrastructure

tofu apply \
  -var-file benchmarks/<run-id>/run.tfvars \
  -state=states/<run-id>.tfstate
```

## Launching a local campaign

Generate a local campaign:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --target local \
  --campaign my-local-run \
  --problem pypsa-de-elec-2-1h
```

This creates:

```text
infrastructure/local/benchmarks/<run-id>/
├── campaign_summary.csv
├── local_benchmarks.yaml
└── run_local.sh
```

By default, local campaigns ask for confirmation before execution.

The generated run script can also be executed manually:

```bash
bash infrastructure/local/benchmarks/<run-id>/run_local.sh
```

Local campaigns use the existing `runner.benchmark` CLI and execute problems sequentially.

## Example workflows

### Cloud campaign

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --configfile benchmarks/config.campaign.default.yaml \
  --campaign pypsa-de-scaling

cd infrastructure

tofu apply \
  -var-file benchmarks/<run-id>/run.tfvars \
  -state=states/<run-id>.tfstate
```

### Local campaign

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --configfile benchmarks/config.campaign.default.yaml \
  --target local \
  --campaign pypsa-de-local
```

The campaign generator creates the local benchmark files and asks whether the benchmark run should be started immediately.

### Running your own problems

To run your own problems, either locally or on the cloud, follow the steps in the appropriate section above but using a `problems.yaml` file of your own that gives the details (metadata) and URL/path of each problem.
Here is a small example:

```yaml
problems:
  genx-3_three_zones_w_co2_capture-no_uc-3-1h:
    # Size classification
    Size: M
    # URL of the problem (needed for cloud runs)
    URL: https://storage.googleapis.com/solver-benchmarks/instances/genx-3_three_zones_w_co2_capture-no_uc-3-1h.lp.gz
    # ALTERNATIVELY, for local runs, you can also give a local path
    Path: tests/sample_benchmarks/sample_lp.lp
```

You can quickly try running your own problem locally on our supported set of solvers by following the [instructions in the root README](../README.md#running-supported-solvers-on-problems).

### Running other solvers

To run either our problems, or your own (see the previous section), on a solver that we do not yet support, you need to add it to its per-solver-year pixi manifest(s) under `runner/envs/` (see [Updating Solver Versions](../runner/SOLVERS.md#updating-solver-versions)), add a solver adapter module under `runner/utils/solvers/` (see any existing module there for the template), and add its tuning options to `runner/config/solver_configurations.yaml`. Please reach out to us (or open an issue) if you would like more details, or any help with this.

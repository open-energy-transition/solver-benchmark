# Benchmark campaigns

`create_benchmark_campaign.py` selects problems from `results/metadata.yaml` and creates a benchmark campaign:

- `--target cloud` (default): the VM files of a Google Cloud campaign, under `infrastructure/benchmarks/<run-id>/`. Only maintainers launch cloud campaigns, as they cost money.
- `--target local`: a script that runs the campaign on your machine, under `infrastructure/local/benchmarks/<run-id>/`.

For example, to create a campaign of all problems:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py --campaign my-test --all
```

The run ID is `YYYYMMDD-<campaign>`. The script stops if the campaign's folder exists, unless you add `--force` to overwrite it.

Before selecting problems, the script runs `merge_metadata.py` and `categorize_benchmarks.py` (see [README.md](README.md#scripts)), which update the metadata and download every problem without statistics. Add `--skip-prepare` to skip them.

Every campaign includes a `campaign_summary.csv` with its problems, settings and VM allocation.

## Configuration files

[`config.campaign.default.yaml`](config.campaign.default.yaml) is a template with every setting and its description. Arguments on the command line replace the values of the file:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --configfile benchmarks/config.campaign.default.yaml \
  --campaign my-test --timeout-hours 6
```

## Selecting problems

| Option | Selects |
|---|---|
| `--all` | All problems. |
| `--problem ID [ID ...]` | Problems by their ID in `results/metadata.yaml`. |
| `--size S M L` | Only problems of these sizes, with `--all` or `--problem`. |
| `--do-not-skip` | Also the problems with a `Skip because` field, which are left out by default as they time out or run out of memory. |

For example, to select the S and M problems among two PyPSA problems:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign pypsa-de-test --problem pypsa-de-elec-2-1h pypsa-de-elec-4-1h --size S M
```

## Solvers and years

By default, campaigns run the configurations `gurobi-default`, `highs-default`, `scip-default`, `cbc-default` and `glpk-default`, with the 2025 solver versions. Choose others with `--solver-configurations` and `--years`:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign year-test --all --solver-configurations cbc-default highs-default --years 2024 2025
```

Each configuration and year runs only where it is registered in `runner/config/solvers.yaml` and eligible under `runner/config/eligibility_rules.yaml`. `runner/config/solver_configurations.yaml` lists the configurations, e.g. `highs-hipo`.

## VMs and timeouts

By default, each problem of a cloud campaign gets its own VM, whose machine profile and timeout depend on the size of the problem:

| Size | Profile | Machine type | Timeout |
|---|---|---|---|
| S, M | `short` | c4-standard-2 | 1 hour |
| L | `long` | c4-highmem-16 | 24 hours |

| Option | Effect |
|---|---|
| `--num-vms N` | Allocate the problems of each profile to N VMs, balancing their `--weight-col` (default `Num. variables`). |
| `--machine-type short\|long` | Use this profile for all problems. |
| `--zone ZONE` | Create the VMs in this zone (default `us-central1-a`). |
| `--vm-prefix PREFIX` | Prefix of the names of the VM files (default `benchmark-instance-<campaign>`). |
| `--timeout-hours H` | Use this timeout for all problems, also in local campaigns. |

## Cost estimate

Before writing the files of a cloud campaign, the script prints an estimate of its cost and asks for confirmation. For example, for two S/M problems with the default solvers and year:

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --campaign example \
  --problem pypsa-de-elec-2-1h genx-3_three_zones_w_co2_capture-no_uc-3-1h
```

```text
Allocated 2 problems to 2 VMs by Num. variables:
  VM 00: 1 problem, Num. variables 569,341
  VM 01: 1 problem, Num. variables 103,506

Cost estimate
=============
Runs:                6 (3 with a past run of the same problem and solver version)
VM-hours:            1.9 expected, 6.9 if every run times out
Cost:                $0.20 expected, $0.70 if every run times out
Longest VM:          1.6 h expected, 3.4 h if every run times out
Prices:              on-demand in us-central1, checked on 2026-11-04

By machine type:
  c4-standard-2: 2 VMs, 6 runs, $0.20 expected, $0.70 if every run times out

Create the campaign? [y/N]
```

The estimate counts the runs of each VM: every solver configuration and year that is registered in `runner/config/solvers.yaml` and eligible under `runner/config/eligibility_rules.yaml` for each of its problems. A run's expected time is that of the latest past run of the same problem and solver version in `results/benchmark_results.csv`, or else the average share of the timeout the solver used on similar problems, or else its whole timeout. The worst case is every run hitting its timeout.

Each VM's hours also include its setup (booting, installing the solver environments, downloading the problems and uploading the results) and the reference benchmarks the runner runs once an hour (`reference_benchmark_interval` in `infrastructure/main.tf`). VM prices, disk cost, setup time and the time of a reference benchmark are in `runner/config/vm_costs.yaml`. Update them when Google Cloud prices change, and add the price of any new machine type: the script stops with an error for a machine type without a price. The setup and reference benchmark times are typical values measured on the campaigns of 2026, so the case in which every run times out is not a strict upper bound.

Answer `y` to create the campaign; any other answer creates nothing. Add `--yes` to skip the question.

## Launching a cloud campaign

The VMs clone the repository from GitHub at the branch or tag in `git_ref` of `run.tfvars`: the branch checked out when the campaign was created, or `main` if HEAD was detached. Push that branch before launching.

After creating a cloud campaign, the script checks it and stops with an error if it would fail: VM names that Google Cloud rejects, VM files without problems, problem fields or years, unknown solver configurations, or a `git_ref` that isn't on GitHub. It warns if the local checkout differs from what the VMs will run: uncommitted or untracked changes, another branch, or unpushed commits. Run the same check again after editing the generated files:

```bash
pixi run -e runner python -m runner.utils.campaign infrastructure/benchmarks/<run-id>
```

Then launch the campaign from `infrastructure/`, with a state file of its own (see [infrastructure/README.md](../infrastructure/README.md) for the setup and the VM options):

```bash
cd infrastructure
tofu apply -var-file benchmarks/<run-id>/run.tfvars -state=states/<run-id>.tfstate
```

## Running a local campaign

```bash
pixi run -e benchmarks python benchmarks/create_benchmark_campaign.py \
  --target local --campaign my-local-run --problem pypsa-de-elec-2-1h
```

This creates:

```text
infrastructure/local/benchmarks/<run-id>/
├── campaign_summary.csv
├── local_benchmarks.yaml
└── run_local.sh
```

The script then asks whether to run the campaign now. `run_local.sh` runs the problems one after the other with `runner.benchmark`. Add `--yes` to start it without asking, or run it later:

```bash
bash infrastructure/local/benchmarks/<run-id>/run_local.sh
```

## Running your own problems

To run your own problems, write a YAML file with their size, their problem class and their URL or, for local runs, their path:

```yaml
problems:
  genx-3_three_zones_w_co2_capture-no_uc-3-1h:
    Size: M
    Problem class: LP
    URL: https://storage.googleapis.com/solver-benchmarks/instances/genx-3_three_zones_w_co2_capture-no_uc-3-1h.lp.gz
  my-problem:
    Size: S
    Problem class: LP
    Path: tests/sample_benchmarks/sample_lp.lp
```

Then run it as in [Running benchmarks locally](../README.md#running-benchmarks-locally). To run a solver that the runner doesn't support yet, see [Adding a new solver](../runner/SOLVERS.md#adding-a-new-solver), and open an issue if you need help.

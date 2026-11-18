# Open Energy Benchmark

The Open Energy Benchmark measures the performance of optimization solvers on problems from energy system models, and presents the results on an interactive website: [openenergybenchmark.org](https://openenergybenchmark.org/).

This repository contains the metadata of the benchmark problems, the runner that solves them, the infrastructure that runs benchmark campaigns on Google Cloud, and the website.

## Benchmark problems

All problems are open LP or MPS files, which can be downloaded from the website's [Benchmark Problem Set](https://openenergybenchmark.org/dashboard/benchmark-problem-set) page. Their metadata is in [`benchmarks/`](benchmarks/README.md), one folder per modelling framework or source, with instructions to reproduce the problems we generated. To contribute problems, see [CONTRIBUTING.md](CONTRIBUTING.md#contributing-benchmark-problems).

## Solvers

The runner runs HiGHS, SCIP, CBC, GLPK and Gurobi, with one version per release year, and also supports CPLEX, MOSEK, Knitro and Xpress. [runner/SOLVERS.md](runner/SOLVERS.md) lists the versions and describes how to add a solver.

## Project structure

```text
solver-benchmark/
├── benchmarks/       # Problem metadata, one folder per framework or source, and the campaign generator
├── runner/           # Benchmark runner (python -m runner.benchmark)
│   ├── config/       # Solver versions, configurations, eligibility rules and VM costs
│   ├── envs/         # One pixi environment per solver version
│   ├── utils/        # Run loop, solver adapters, campaign allocation and cost estimate
│   └── tests/        # Unit tests
├── results/          # metadata.yaml (merged from benchmarks/) and benchmark_results.csv
├── tests/            # Metadata and results checks, and the sample problems that CI solves
├── infrastructure/   # OpenTofu configuration and startup script of the benchmark VMs
├── website/          # Next.js website
├── notebooks/        # Analysis notebooks
└── archive/          # Retired code, kept for reference
```

## Running benchmarks locally

The runner needs Linux, as it limits the memory of the solvers with `systemd-run`, and [pixi](https://pixi.sh), which installs Python and the solver environments. On macOS and Windows, use the [Docker image](runner/README.md#running-with-docker).

For example, to run HiGHS and SCIP 2025 on two sample problems:

```bash
pixi run -e runner python -m runner.benchmark \
  --solver-configurations highs-default --solver-configurations scip-default \
  --years 2025 infrastructure/benchmarks/sample_run/standard-00.yaml
```

The runner writes the results to `results/benchmark_results.csv`, replacing the committed results unless you add `--append`, and the solver logs to `runner/logs/`. [runner/README.md](runner/README.md) describes all its options. To view the results, [run the website locally](website/README.md#running-locally).

## Benchmark campaigns

The campaign generator selects problems from `results/metadata.yaml`, allocates them to VMs and writes a campaign, either for Google Cloud or as a local run script: see [benchmarks/CAMPAIGNS.md](benchmarks/CAMPAIGNS.md), and [infrastructure/README.md](infrastructure/README.md) for the VMs. Only maintainers launch cloud campaigns, as they cost money.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to set up the development environments, run the tests and open a pull request.

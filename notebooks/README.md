# Notebooks

The notebooks analyze benchmark results and run benchmark campaigns. They run in the `notebooks` pixi environment (see [CONTRIBUTING.md](../CONTRIBUTING.md#development-setup) for the setup). From the repository root:

```bash
pixi run -e notebooks jupyter lab
```

or open a shell in the environment with `pixi shell -e notebooks`.

## Downloading results from Google Cloud Storage

The notebooks that analyze the results of cloud campaigns need them locally. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install), which is not in the pixi environment, log in with `gcloud auth login`, and run from the repository root:

```bash
mkdir -p runner/logs results/gcp-results
gcloud storage rsync --recursive gs://solver-benchmarks/logs runner/logs/
gcloud storage rsync --recursive gs://solver-benchmarks/results results/gcp-results/
```

The Gurobi logs are in `gs://solver-benchmarks-restricted/logs`, which only maintainers can read:

```bash
gcloud storage rsync --recursive gs://solver-benchmarks-restricted/logs runner/logs/
```

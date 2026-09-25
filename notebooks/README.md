# Instructions for running the notebooks

The notebooks in this directory run in the `notebooks` [pixi](https://pixi.sh) environment (see the root [README's Development section](../README.md#development) for installing `pixi` and setting up environments in general).

From the repo root, run Jupyter inside the environment:

```bash
pixi run -e notebooks jupyter lab
```

Alternatively, activate a shell in the environment so you don't need to prefix every command with `pixi run -e notebooks`:

```bash
pixi shell -e notebooks
```

## Downloading results from Google Cloud Storage (GCS)

Notebooks that analyze results from GCS require the results to be downloaded locally. This uses the [gcloud CLI](https://cloud.google.com/sdk/docs/install), which is not part of the pixi environment. After installing it, authenticate with `gcloud auth login` and run the following commands (from the repo root):

```bash
mkdir runner/logs/
mkdir results/gcp-results/
gcloud storage rsync --recursive gs://solver-benchmarks/logs runner/logs/
gcloud storage rsync --recursive gs://solver-benchmarks-restricted/logs runner/logs/
gcloud storage rsync --recursive gs://solver-benchmarks/results results/gcp-results/
```

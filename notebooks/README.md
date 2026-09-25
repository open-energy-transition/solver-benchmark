# Instructions for running the notebooks

To run the notebooks in this directory, you need to create an environment with the required dependencies. The dependencies are listed in the `pyproject.toml` file. Here we use `uv` to manage the environment.

1. First, make sure you have `uv` installed or install it if needed (see [uv installation instructions](https://docs.astral.sh/uv/getting-started/installation/)).

2. Navigate to the `notebooks` directory and sync the environment.

```bash
cd notebooks
uv sync
```

3. Activate the environment.

```bash
source .venv/bin/activate
```

## Downloading results from Google Cloud Storage (GCS)

Notebooks that analyze results from GCS require the results to be downloaded locally. This uses the [gcloud CLI](https://cloud.google.com/sdk/docs/install), which is not part of the `uv` environment. After installing it, authenticate with `gcloud auth login` and run the following commands:

```bash
mkdir ../runner/logs/
mkdir ../results/gcp-results/
gcloud storage rsync --recursive gs://solver-benchmarks/logs ../runner/logs/
gcloud storage rsync --recursive gs://solver-benchmarks-restricted/logs ../runner/logs/
gcloud storage rsync --recursive gs://solver-benchmarks/results ../results/gcp-results/
```

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

Notebooks that analyze results from GCS require the results to be downloaded locally. You can do this by running the following commands:

```bash
mkdir ../runner/logs/
mkdir ../results/gcp-results/
gsutil -m rsync -r gs://solver-benchmarks/logs ../runner/logs/
gsutil -m rsync -r gs://solver-benchmarks-restricted/logs ../runner/logs/
gsutil -m rsync -r gs://solver-benchmarks/results ../results/gcp-results/
```

On MacOS, you may need to add the following flag to the `gsutil` commands if you experience problems with multiprocessing: `-o "GSUtil:parallel_process_count=1"`.

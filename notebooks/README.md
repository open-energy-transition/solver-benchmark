# Instructions for running the notebooks

To run the notebooks in this directory, you need to create an environment with the required dependencies. The environments for this repo (including this one) are managed by [pixi](https://pixi.sh) from the root `pixi.toml`.

1. First, make sure you have `pixi` installed (see [pixi installation instructions](https://pixi.sh/latest/installation/)).

2. From the repo root, install the `notebooks` environment.

```bash
pixi install -e notebooks
```

3. Run Jupyter (or any other command) inside the environment.

```bash
pixi run -e notebooks jupyter lab
```

Alternatively, activate a shell in the environment so you don't need to prefix every command with `pixi run -e notebooks`:

```bash
pixi shell -e notebooks
```

## Downloading results from Google Cloud Storage (GCS)

Notebooks that analyze results from GCS require the results to be downloaded locally. You can do this by running the following commands (from the repo root):

```bash
mkdir runner/logs/
mkdir results/gcp-results/
pixi run -e notebooks gsutil -m rsync -r gs://solver-benchmarks/logs runner/logs/
pixi run -e notebooks gsutil -m rsync -r gs://solver-benchmarks-restricted/logs runner/logs/
pixi run -e notebooks gsutil -m rsync -r gs://solver-benchmarks/results results/gcp-results/
```

On MacOS, you may need to add the following flag to the `gsutil` commands if you experience problems with multiprocessing: `-o "GSUtil:parallel_process_count=1"`.

# Dockerfile for the benchmark runner
#
# Build:
#   docker build -t solver-benchmark-runner -f runner/Dockerfile .
#
# Run:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     solver-benchmark-runner --solvers highs --years 2025 results/metadata.yaml
#
# Per-solver-year conda environments are created at runtime by
# runner/benchmark.py. To cache them across runs, use a named volume:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     -v solver-conda-envs:/opt/conda/envs \
#     solver-benchmark-runner --solvers highs --years 2025 results/metadata.yaml
#
# Note: systemd is not available inside Docker, so memory limit enforcement
# via systemd-run is skipped. The runner falls back gracefully.

FROM continuumio/miniconda3

# Install system dependencies:
#  - time: GNU time for detailed resource measurement
#  - git: needed by some conda packages / pip installs
#  - coreutils: provides timeout
#  - procps: provides ps (useful for debugging)
#  - build-essential: C/C++ compiler needed by some solver packages (e.g. highspy)
#  - curl: needed to install pixi below
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        time \
        git \
        coreutils \
        procps \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install pixi, which manages the runner CLI's own dependencies (pyyaml,
# psutil, requests, pandas, typer, ...). Separate from the per-solver-year
# conda envs runner/benchmark.py creates at runtime -- those still use
# conda directly, since this image also needs `conda env create` available.
RUN curl -fsSL https://pixi.sh/install.sh | bash
ENV PATH="/root/.pixi/bin:${PATH}"

WORKDIR /solver-benchmark

# Copy the pixi workspace files first so the runner env can be installed
COPY pixi.toml pixi.lock ./

# Copy runner scripts and environment definitions
COPY runner/ runner/

# Copy test fixtures (sample benchmarks used for validation runs)
COPY tests/ tests/

# Copy benchmark metadata
COPY results/metadata.yaml results/metadata.yaml

# Copy project-level config files needed by the runner
COPY ruff.toml pytest.ini ./

RUN pixi install -e runner

ENTRYPOINT ["pixi", "run", "-e", "runner", "python", "-m", "runner.benchmark"]

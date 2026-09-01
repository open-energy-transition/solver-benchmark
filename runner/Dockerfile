# Dockerfile for the benchmark runner
#
# Build:
#   docker build -t solver-benchmark-runner -f runner/Dockerfile .
#
# Run:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
#
# Per-solver-year pixi environments (runner/envs/<env>/) are installed at
# runtime by runner/benchmark.py. To cache them across runs, use a named
# volume:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     -v solver-pixi-envs:/solver-benchmark/runner/envs \
#     solver-benchmark-runner --solver-configurations highs-default --years 2025 results/metadata.yaml
#
# Note: systemd is not available inside Docker, so memory limit enforcement
# via systemd-run is skipped. The runner falls back gracefully.

FROM debian:bookworm-slim

# Install system dependencies:
#  - time: GNU time for detailed resource measurement
#  - git: needed for pip git-source installs (see e.g.
#    runner/envs/benchmark-highs-2023/pixi.toml)
#  - coreutils: provides timeout
#  - procps: provides ps (useful for debugging)
#  - build-essential: C/C++ compiler, in case a pip build falls back to it
#    (per-env `cxx-compiler` pixi dependencies are normally self-contained)
#  - ca-certificates: HTTPS access for pixi/conda/PyPI downloads
#  - curl: needed to install pixi below
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        time \
        git \
        coreutils \
        procps \
        build-essential \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install pixi, which manages both the runner CLI's own dependencies
# (pyyaml, psutil, requests, pandas, typer, ...) and every per-solver-year
# env under runner/envs/ (each its own separate pixi manifest).
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

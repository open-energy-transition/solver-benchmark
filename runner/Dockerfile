# Dockerfile for the benchmark runner
#
# Build:
#   docker build -t solver-benchmark-runner -f runner/Dockerfile .
#
# Run:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     solver-benchmark-runner -s "highs" -y "2025" results/metadata.yaml
#
# Conda environments are created at runtime by benchmark_all.sh.
# To cache them across runs, use a named volume:
#   docker run --rm \
#     -v $(pwd)/results:/solver-benchmark/results \
#     -v solver-conda-envs:/opt/conda/envs \
#     solver-benchmark-runner -s "highs" -y "2025" results/metadata.yaml
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
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        time \
        git \
        coreutils \
        procps \
        build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && conda install -y -n base pyyaml && conda clean -afy

WORKDIR /solver-benchmark

# Copy runner scripts and environment definitions
COPY runner/ runner/

# Copy test fixtures (sample benchmarks used for validation runs)
COPY tests/ tests/

# Copy benchmark metadata
COPY results/metadata.yaml results/metadata.yaml

# Copy project-level config files needed by the runner
COPY ruff.toml pytest.ini ./

ENTRYPOINT ["bash", "runner/benchmark_all.sh"]

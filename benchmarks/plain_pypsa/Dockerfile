# A Dockerfile to generate the Pypsa benchmarks reproducibly
# Build with: docker build .
# Debug with: docker run -it --entrypoint bash <image hash>

# Use a lightweight base image with conda support
FROM continuumio/miniconda3 AS plain_pypsa_benchmark_gen_base

# Activate conda env automatically
ENV CONDA_ENV_NAME=plain-pypsa-benchmark-gen

USER root
RUN apt-get update && apt-get install -y git

FROM plain_pypsa_benchmark_gen_base AS conda_env
RUN --mount=type=cache,target=/opt/conda/pkgs \
    conda create --name $CONDA_ENV_NAME

RUN eval "$(conda shell.bash hook)" \
    && conda activate $CONDA_ENV_NAME \
    && conda config --add channels conda-forge \
    && conda install pypsa=0.30.3 \
    && pip install highspy==1.7.2 \
    && pip install git+https://github.com/open-energy-transition/linopy.git@92e289a --no-deps

FROM conda_env AS plain_pypsa_benchmark_gen
COPY --chown=conda . solver-benchmarks
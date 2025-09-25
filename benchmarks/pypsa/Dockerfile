# A Dockerfile to generate the Pypsa benchmarks reproducibly
# Build with: docker build .
# Debug with: docker run -it --entrypoint bash <image hash>

# Use a lightweight base image with conda support
FROM continuumio/miniconda3 AS benchmark_gen_base

# Activate conda env automatically
ENV CONDA_ENV_NAME=benchmark-gen

USER root
RUN apt-get update && apt-get install -y git

FROM benchmark_gen_base AS repo_clone
RUN git clone --filter=blob:none https://github.com/PyPSA/pypsa-eur.git \
    && cd pypsa-eur \
    && git checkout 3a058b4
    # This is the last commit of PyPSA-Eur on Sept 16th 2025

FROM repo_clone AS conda_env
RUN --mount=type=cache,target=/opt/conda/pkgs \
    cd pypsa-eur \
    && conda env create -f envs/linux-64.lock.yaml -n $CONDA_ENV_NAME

RUN eval "$(conda shell.bash hook)" \
    && conda activate $CONDA_ENV_NAME \
    && pip install git+https://github.com/open-energy-transition/linopy.git@075f24e --no-deps
    # This is a commit on linopy branch only-generate-problem-files

# Now patch solve_network.py so that it generates LP files without solving:
COPY solve_network.patch pypsa-eur/solve_network.patch
RUN cd pypsa-eur && git apply solve_network.patch

FROM conda_env AS benchmark_gen
COPY --chown=conda . pypsa-eur/solver-benchmarks

# For now, let's run this command manually in the above docker container:

# RUN eval "$(conda shell.bash hook)" \
#     && conda activate $CONDA_ENV_NAME \
#     && cd pypsa-eur \
#     && ./solver-benchmarks/generate.sh

# Cache data downloads? .snakemake/storage?

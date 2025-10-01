# A Dockerfile to generate the Pypsa benchmarks reproducibly
# Build with: docker build .
# Debug with: docker run -it --entrypoint bash <image hash>

# Use a lightweight base image with conda support
FROM continuumio/miniconda3 AS pypsa_benchmark_gen_base

# Create a non‑root user and switch to it
USER root

# Install system packages
RUN apt-get update && apt-get install -y git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set environment name
ENV CONDA_ENV_NAME=pypsa-benchmark-gen

FROM pypsa_benchmark_gen_base AS repo_clone
RUN git clone --filter=blob:none https://github.com/PyPSA/pypsa-eur.git \
    && cd pypsa-eur \
    && git checkout 3a058b4
    # This is the last commit of PyPSA-Eur on Sept 16th 2025

FROM repo_clone AS conda_env
RUN --mount=type=cache,target=/opt/conda/pkgs \
    cd pypsa-eur \
    && conda env create -f envs/linux-64.lock.yaml -n $CONDA_ENV_NAME

RUN /bin/bash -c "\
    source $(conda info --base)/etc/profile.d/conda.sh && \
    conda activate $CONDA_ENV_NAME && \
    pip install git+https://github.com/open-energy-transition/linopy.git@075f24e --no-deps \
"

# Now patch solve_network.py so that it generates LP files without solving:
COPY solve_network.patch pypsa-eur/solve_network.patch
RUN cd pypsa-eur && git apply solve_network.patch

FROM conda_env AS pypsa_benchmark_gen
COPY --chown=conda . pypsa-eur/solver-benchmarks
WORKDIR /home/conda/solver-benchmarks
CMD ["bash"]

# Initialise conda for the conda user permanently
RUN echo 'source $(conda info --base)/etc/profile.d/conda.sh' >> /home/conda/.bashrc && \
    echo 'conda activate $CONDA_ENV_NAME' >> /home/conda/.bashrc

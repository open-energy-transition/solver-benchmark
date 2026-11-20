# A Dockerfile to generate the Pypsa benchmarks reproducibly

# Use a lightweight base image with ubuntu latest support
FROM ubuntu:latest AS pypsa_benchmark_gen_base

#Switch to root user
USER root

# Install system packages
RUN apt-get update && apt-get install -y git wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

FROM pypsa_benchmark_gen_base AS repo_clone
RUN git clone --filter=blob:none https://github.com/PyPSA/pypsa-eur.git \
    && cd pypsa-eur \
    && git checkout 1b83697f9c2c18ac4c7e0c8c719aff327c221843
    # Pinned PyPSA-Eur revision (11 Nov 2026) for reproducible benchmark generation

FROM repo_clone AS pixi_env
RUN wget -qO- https://pixi.sh/install.sh | sh

FROM pixi_env AS pypsa_eur_setup
# Set up PATH and add explicit pip installation
ENV PATH="/root/.pixi/bin:${PATH}"
RUN cd pypsa-eur && \
    pixi install --locked && \
    pixi run python -m ensurepip && \
    pixi run python -m pip install --upgrade pip && \
    pixi run python -m pip install ruamel.yaml

FROM pypsa_eur_setup AS pypsa_benchmark_gen
ENV PYTHONUNBUFFERED=1
COPY . pypsa-eur/
WORKDIR pypsa-eur/
CMD ["bash"]

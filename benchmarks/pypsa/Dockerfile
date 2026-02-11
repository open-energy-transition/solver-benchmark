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
    && git checkout 6a5489e
    # This is the last commit of PyPSA-Eur on Feb 11, 2026

FROM repo_clone AS pixi_env
RUN wget -qO- https://pixi.sh/install.sh | sh

FROM pixi_env AS pypsa_eur_setup
# Set up PATH and add explicit pip installation
ENV PATH="/root/.pixi/bin:${PATH}"
RUN cd pypsa-eur && \
    pixi install --locked && \
    pixi run python -m ensurepip && \
    pixi run python -m pip install --upgrade pip && \
    pixi run python -m pip install ruamel.yaml && \
    pixi run python -m pip install --no-deps git+https://github.com/open-energy-transition/linopy.git@9116e17

# Now patch solve_network.py so that it generates LP files without solving:
COPY solve_network.patch pypsa-eur/solve_network.patch
RUN cd pypsa-eur && git apply solve_network.patch

FROM pypsa_eur_setup AS pypsa_benchmark_gen
ENV PYTHONUNBUFFERED=1
COPY --chown=pixi . pypsa-eur/
WORKDIR pypsa-eur/
CMD ["bash"]

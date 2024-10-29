# A dockerfile to generate the Pypsa benchmarks reproducibly
# Build with: docker build .
# Debug with: docker run -it --entrypoint bash <image hash>

# Use a lightweight base image with micromamba support
FROM mambaorg/micromamba AS benchmark_gen_base

# Activate mamba env automatically
ENV MAMBA_DOCKERFILE_ACTIVATE=1
ENV CONDA_ENV_NAME=benchmark-gen

USER root
RUN apt-get update && apt-get install -y git
USER mambauser

FROM benchmark_gen_base AS repo_clone
RUN git clone --filter=blob:none https://github.com/PyPSA/pypsa-eur.git \
    && cd pypsa-eur \
    && git checkout 1f471cee

FROM repo_clone AS mamaba_env
RUN --mount=type=cache,target=/opt/conda/pkgs \
    cd pypsa-eur \
    && micromamba env create -f envs/linux-pinned.yaml -n benchmark-gen

RUN eval "$(micromamba shell hook --shell bash)" \
    && micromamba activate benchmark-gen \
    && pip install git+https://github.com/open-energy-transition/linopy.git@92e289a --no-deps
    # This is a commit on linopy branch only-generate-problem-files

# Now patch solve_network.py so that it generates LP files without solving:
COPY solve_network.patch pypsa-eur/solve_network.patch
RUN cd pypsa-eur && git apply solve_network.patch

FROM mamaba_env AS tutorial
RUN eval "$(micromamba shell hook --shell bash)" \
    && micromamba activate benchmark-gen \
    && cd pypsa-eur \
    && snakemake -call results/test-elec/networks/base_s_6_elec_lcopt_.nc --configfile config/test/config.electricity.yaml

# CONTINUE (tutorial gens LP, but retcode 1 fails docker build)
# write bash script to gen benchs, allowing snakemake failure if LP produced
# Cache data downloads? .snakemake/storage?

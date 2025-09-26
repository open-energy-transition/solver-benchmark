# Use a lightweight base image with conda support
FROM continuumio/miniconda3 AS plain_pypsa_benchmark_gen_base

# Create a non‑root user and switch to it
RUN useradd -m conda
USER root

# Install system packages
RUN apt-get update && apt-get install -y git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER conda

# Set environment name
ENV CONDA_ENV_NAME=plain-pypsa-benchmark-gen

# Create the environment (no activation yet)
RUN conda create --name $CONDA_ENV_NAME --yes

# Initialise conda for bash and install packages
RUN /bin/bash -c "\
    source $(conda info --base)/etc/profile.d/conda.sh && \
    conda activate $CONDA_ENV_NAME && \
    conda config --add channels conda-forge && \
    conda install pypsa=0.30.3 xarray=2024.2.0 --yes && \
    pip install highspy==1.7.2 && \
    pip install git+https://github.com/open-energy-transition/linopy.git@92e289a --no-deps \
"

# Final stage – copy source files
FROM plain_pypsa_benchmark_gen_base AS plain_pypsa_benchmark_gen
COPY --chown=conda:conda . /home/conda/solver-benchmarks
WORKDIR /home/conda/solver-benchmarks
CMD ["bash"]

# Initialise conda for the conda user permanently
RUN echo 'source $(conda info --base)/etc/profile.d/conda.sh' >> /home/conda/.bashrc && \
    echo 'conda activate $CONDA_ENV_NAME' >> /home/conda/.bashrc
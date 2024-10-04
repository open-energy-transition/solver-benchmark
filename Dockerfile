# Use a lightweight base image with micromamba support
FROM mambaorg/micromamba

# Set environment variables for micromamba
ENV MAMBA_DOCKERFILE_ACTIVATE=1
ENV CONDA_ENV_NAME=pypsa-eur

# Set working directory to /app
WORKDIR /app

# Install git for cloning repositories
RUN micromamba install -n base -c conda-forge git -y

# Copy the current directory (your local files) into /app
COPY . /app

# Clone the PyPSA-Eur repository into /app/pypsa-eur
RUN git clone https://github.com/PyPSA/pypsa-eur.git /app/pypsa-eur

RUN cd /app/pypsa-eur

RUN micromamba env create -f pypsa-eur/envs/environment.yaml --yes

# Run boot.sh when the container starts
ENTRYPOINT [ "/app/boot.sh" ]

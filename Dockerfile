FROM ubuntu:20.04

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    build-essential \
    curl \
    coreutils \
    time \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install micromamba
RUN curl -L https://micromamba.snakepit.net/api/micromamba/linux-64/latest | tar -xvj -C /usr/local/bin/ --strip-components=1 bin/micromamba

# Set working directory
WORKDIR /app
COPY . .

# Install necessary tools and clone PyPSA-Eur repo
RUN git clone https://github.com/PyPSA/pypsa-eur.git && \
    cd pypsa-eur && \
    git checkout a69373b9

# Install the conda environment using micromamba
RUN micromamba create -f ./pypsa-eur/envs/environment.yaml --yes && \
    micromamba clean --all --yes

# Install snakemake within the environment
RUN micromamba run -n pypsa-eur pip install snakemake

# Install the custom linopy branch
RUN micromamba run -n pypsa-eur pip install git+https://github.com/open-energy-transition/linopy.git@only-generate-problem-files --no-deps

RUN cd pypsa-eur && \
    micromamba run -n pypsa-eur time snakemake -call results/networks/elec_s_20_ec_lv1_3h_op.nc --cores all --printshellcmds --configfile ../benchmarks/pypsa/pypsa-eur-elec-20-lv1-3h-op.yaml ; echo -e '\a'

# Use micromamba and activate the environment by default
CMD ["/bin/bash", "-c", "micromamba shell hook --shell bash > ~/.bashrc && source ~/.bashrc && micromamba activate pypsa-eur && exec /bin/bash"]

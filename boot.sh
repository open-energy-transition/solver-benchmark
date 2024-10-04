#!/bin/bash

micromamba install -n pypsa-eur -c conda-forge pip -y

micromamba install -n pypsa-eur -c conda-forge git -y

# Navigate to the pypsa-eur directory
cd /app/pypsa-eur

micromamba run -n pypsa-eur  pip install git+https://github.com/open-energy-transition/linopy.git@only-generate-problem-files --no-deps

micromamba run -n pypsa-eur snakemake -call results/test-elec/networks/base_s_6_elec_lcopt_.nc --configfile config/test/config.electricity.yaml

# Keep the shell running for interaction
exec /bin/bash

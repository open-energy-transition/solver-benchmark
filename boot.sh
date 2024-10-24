#!/bin/bash


micromamba install -n pypsa-eur -c conda-forge pip -y

micromamba install -n pypsa-eur -c conda-forge git -y

micromamba install -n pypsa-eur -c conda-forge time -y


micromamba run -n pypsa-eur pip install git+https://github.com/open-energy-transition/linopy.git@only-generate-problem-files --no-deps


# Get the config files for the sample problems from ... and put them in /pypsa-eur/config
cp -r benchmarks/pypsa/* pypsa-eur/config
# Get the solver_benchmark_pypsa_eur.py and place it in the /pypsa-eur folder
mv pypsa-eur/config/solver_benchmark_pypsa_eur.py pypsa-eur/

sed -i '/cf_solving = solving\["options"\]/a\    kwargs["keep_files"] = cf_solving.get("keep_files", True)' pypsa-eur/scripts/solve_network.py

cd /app/pypsa-eur
micromamba run -n pypsa-eur python solver_benchmark_pypsa_eur.py --configfile config/pypsa-eur-elec-10-lvopt-3h.yaml

exec /bin/bash

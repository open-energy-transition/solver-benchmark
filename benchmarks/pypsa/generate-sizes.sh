#!/bin/bash

#SBATCH --job-name=benchmark-gen-pypsa-eur-sec
#SBATCH -N1 -n1
#SBATCH --partition=small
#SBATCH --cpus-per-task=2
#SBATCH --mem=8G
#SBATCH --time=8:00:00  # 1h per benchmark size

#SBATCH --constraint=Gold6342  # Run on Intel(R) Xeon(R) Gold 6342 CPUs
#SBATCH --mail-user=siddharth.krishna@openenergytransition.org

# SNAKEMAKE_RESOURCES=" --cores 1 --resources mem_mb=4000" # For testing on z1
SNAKEMAKE_RESOURCES=""

line=$(eval printf '=%.0s' {1..80})

benchmark="pypsa-eur-sec"
# benchmark="pypsa-eur-elec-op" # TODO next

# Create a list of target postnetworks for all sizes
targets=$(for n in {2..10}; do for res in 1h 3h 12h 24h; do echo results/postnetworks/base_s_${n}_lv1_${res}__2050.nc; done; done)
CONTINUE do pre nets in parallel and dump LPs in sequence (can also solve if required)

for n in {3..10}; do
    res="24h"
    output_file="results/postnetworks/base_s_${n}_lv1_${res}__2050.nc"
    LP_FILE="/scratch/htc/skrishna/solver-benchmark/benchmarks/${benchmark}-${n}-${res}.lp"

    # Once to run all previous rules until it generates the LP file
    export ONLY_GENERATE_PROBLEM_FILE="$LP_FILE"
    echo -e "\n$line\nGenerating $LP_FILE\n$line"
    /usr/bin/time snakemake -call $output_file --configfile ./solver-benchmarks/pypsa-eur-sec-2-${res}.yaml $SNAKEMAKE_RESOURCES

    # Again to add a timeout to the solver
    unset ONLY_GENERATE_PROBLEM_FILE
    echo -e "\n$line\nSolving $LP_FILE\n$line"
    /usr/bin/time timeout 3600s snakemake -call $output_file --configfile ./solver-benchmarks/pypsa-eur-sec-2-${res}.yaml $SNAKEMAKE_RESOURCES

    retcode=$?
    if [ $retcode -eq 124 ]; then
        echo "The solver timed out. Exiting the generation script."
        exit 0
    fi
done

# TODO --cores all?
# TODO rename config files to remove nodes? also change paths here

# snakemake results/postnetworks/base_s_2_lv1_3h__2050.nc --configfile ./solver-benchmarks/pypsa-eur-sec-2-24h.yaml --dry-run

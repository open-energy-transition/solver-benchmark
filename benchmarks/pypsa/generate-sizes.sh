#!/bin/bash

#SBATCH --job-name=benchmark-gen-pypsa-eur-sec
#SBATCH -N1 -n1
#SBATCH --partition=small
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=8:00:00  # 1h per benchmark size

#SBATCH --mail-type=ALL --mail-user=siddharth.krishna@openenergytransition.org
# #SBATCH --constraint=Gold6342  # Run on Intel(R) Xeon(R) Gold 6342 CPUs

set -u # The snakemakae call that generates LPs returns nonzero exit code, so allow failures

# Parse command line arguments
usage() {
    echo "Usage: $0 [-n] [-c \"<list of num clusters>\"] [-r \"<list of time resolutions>\"] <benchmark name>"
    echo "Generates the given sizes of the given benchmark"
    echo "Options:"
    echo "    -n    Dry-run, just print snakemake DAGs but do nothing. Default: false"
    echo "    -c    A space separated string of number of clusters. Default: 2 3 ... 10"
    echo "    -r    A space separated string of time resolutions. Default: 1h 3h 12h 24h"
    echo "    -h    Show this help and exit."
}
dry_run=""
clusters=(2 3 4 5 6 7 8 9 10)
resolutions=(1h 3h 12h 24h)
while getopts "hnc:r:" flag
do
    case ${flag} in
    h)  usage
        exit 0
        ;;
    n)  dry_run="--dry-run"
        ;;
    c)  IFS=', ' read -r -a clusters <<< "$OPTARG"
        ;;
    r)  IFS=', ' read -r -a resolutions <<< "$OPTARG"
        ;;
    esac
done
shift $(($OPTIND - 1))
if [[ $# -ne 1 ]]; then
    usage
    exit 1
fi
benchmark=$1

# SNAKEMAKE_RESOURCES=" --cores 1 --resources mem_mb=4000" # For testing
SNAKEMAKE_RESOURCES=""

line=$(eval printf '=%.0s' {1..80})

case ${benchmark} in
    pypsa-eur-sec)
        pre_solve_file="results/prenetworks/base_s_\${n}_lv1_\${res}__2050.nc";;
    pypsa-eur-elec-trex)
        pre_solve_file="resources/networks/base_s_\${n}_elec_lvopt_\${res}.nc";;
    *)
        echo "Unknown benchmark $benchmark"
        exit 1;;
esac

# Single snakemake call that builds all the inputs to the solve_*_network rule
targets=$(for n in "${clusters[@]}"; do for res in "${resolutions[@]}"; do eval echo $pre_solve_file; done; done)
echo -e "\n$line\nBuilding pre-network files for $benchmark\n$line"
/usr/bin/time snakemake --cores all --configfile ./solver-benchmarks/${benchmark}.yaml -call ${targets} ${dry_run}

# Loop over snakemake calls to solve_*_network rules to generate LP files
for n in "${clusters[@]}"; do
    for res in "${resolutions[@]}"; do
        lp_file="/scratch/htc/skrishna/solver-benchmark/runner/benchmarks/${benchmark}-${n}-${res}.lp"
        export ONLY_GENERATE_PROBLEM_FILE="$lp_file"
        echo -e "\n$line\nGenerating $lp_file\n$line"

        result_file="results/postnetworks/base_s_${n}_lv1_${res}__2050.nc"
        # result_file="results/networks/base_s_${n}_elec_lvopt_${res}.nc"

        /usr/bin/time snakemake --cores all --configfile ./solver-benchmarks/${benchmark}.yaml -call ${result_file} ${dry_run}
    done
done

# TODO rename config files to remove nodes? also change paths here

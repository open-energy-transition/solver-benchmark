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
    echo "Usage: $0 [-n] [-c \"<list of num clusters>\"] [-r \"<list of time resolutions>\"] <benchmark name> <output dir>"
    echo "Generates the given sizes of the given benchmark and puts LP files in <output dir>"
    echo "Options:"
    echo "    -n    Dry-run, just print snakemake DAGs but do nothing. Default: false"
    echo "    -c    A space separated string of number of clusters. Default: 2 3 ... 10"
    echo "    -r    A space separated string of time resolutions. Default: 1h 3h 12h 24h"
    echo "    -h    Show this help and exit."
}
dry_run=""
clusters=(10 50 100)
resolutions=(1H 3H)
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
if [[ $# -ne 2 ]]; then
    usage
    exit 1
fi
benchmark=$1
output_dir=$2

# SNAKEMAKE_RESOURCES=" --cores 1 --resources mem_mb=4000" # For testing
SNAKEMAKE_RESOURCES=""

line=$(eval printf '=%.0s' {1..80})

case ${benchmark} in
    pypsa-eur-sec )
        pre_solve_file_schema="results/networks/base_s_\${n}_lv1_\${res}_2050.nc"
        result_file_schema="results/networks/base_s_\${n}_lv1_\${res}_2050.nc"
        ;;
    pypsa-eur-sec-trex_copt )
        pre_solve_file_schema="results/networks/base_s_\${n}_lcopt_\${res}_2050.nc"
        result_file_schema="results/networks/base_s_\${n}_lcopt_\${res}_2050.nc"
        ;;
    pypsa-eur-sec-trex_vopt )
        pre_solve_file_schema="results/networks/base_s_\${n}_lvopt_\${res}_2050.nc"
        result_file_schema="results/networks/base_s_\${n}_lvopt_\${res}_2050.nc"
        ;;
    pypsa-eur-elec-trex_copt | pypsa-eur-elec-trex_copt-ucconv )
        pre_solve_file_schema="resources/networks/base_s_\${n}_elec_lcopt_\${res}.nc"
        result_file_schema="results/networks/base_s_\${n}_elec_lcopt_\${res}.nc"
        ;;
    pypsa-eur-elec-trex_vopt | pypsa-eur-elec-trex_vopt-ucconv )
        pre_solve_file_schema="resources/networks/base_s_\${n}_elec_lvopt_\${res}.nc"
        result_file_schema="results/networks/base_s_\${n}_elec_lcopt_\${res}.nc"
        ;;
    pypsa-eur-elec-op | pypsa-eur-elec-op-ucconv )
        pre_solve_file_schema="resources/networks/base_s_\${n}_elec_lv1_\${res}.nc"
        result_file_schema="results/networks/base_s_\${n}_elec_lv1_\${res}_op.nc"
        ;;
    *)
        echo "Unknown benchmark $benchmark"
        exit 1;;
esac

# Single snakemake call that builds all the inputs to the solve_*_network rule
targets=$(for n in "${clusters[@]}"; do for res in "${resolutions[@]}"; do eval echo $pre_solve_file_schema; done; done)
echo -e "\n$line\nBuilding pre-network files for $benchmark\n$line"
time snakemake --cores all --configfile ./${benchmark}.yaml -call ${targets} ${dry_run}

# Loop over snakemake calls to solve_*_network rules to generate LP files
for n in "${clusters[@]}"; do
    for res in "${resolutions[@]}"; do
        lp_file="${output_dir}/${benchmark}-${n}-${res}.lp"
        echo -e "\n$line\nGenerating $lp_file\n$line"

        export ONLY_GENERATE_PROBLEM_FILE="$lp_file"
        time snakemake --cores all --configfile ./${benchmark}.yaml -call ${result_file} ${dry_run}
    done
done

# TODO rename config files to remove nodes? also change paths here

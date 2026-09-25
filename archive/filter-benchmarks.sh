#!/bin/bash

#SBATCH --job-name=benchmarks-filter-sec
#SBATCH -N1 -n1
#SBATCH --partition=small
#SBATCH --cpus-per-task=1
#SBATCH --mem=8G
#SBATCH --time=36:00:00  # 1h per benchmark size

#SBATCH --mail-type=ALL --mail-user=siddharth.krishna@openenergytransition.org
#SBATCH --constraint=Gold6342  # Run on Intel(R) Xeon(R) Gold 6342 CPUs

python filter-benchmarks.py pypsa-eur-sec

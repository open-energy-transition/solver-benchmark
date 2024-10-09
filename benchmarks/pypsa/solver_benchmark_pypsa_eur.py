# coding=utf-8

##################################################
#                                                #
# Author: Daniele Lerede                         #
# Email: daniele.lerede@openenergytransition.org #
# Version: 0.1                                   #
# Date: 13.08.2024                               #
#                                                #
# Created for Open Energy Transition GmbH        #
#                                                #
##################################################

#########################################################################
#                                                                       #
# IMPORTANT                                                             #
#                                                                       #
# This software is distributed without any warranty.                    #
#                                                                       #
# Neither the author nor Open Energy Transition GmbH                    #
# are liable for any damage caused directly or indirectly by the use    #
# or misuse of this software.                                           #
#                                                                       #
#########################################################################

#############################################################
#                                                           #
# CHANGELOG                                                 #
#                                                           #
# 0.1 - In progress                                         #
#                                                           #
#############################################################

import argparse
import datetime as dt
import pathlib
import subprocess

# Initial configurations

# Set the paths
base_path = pathlib.Path(__file__).parent
log_file_dir = base_path / "logs"

# Ensure the logs directory exists
pathlib.Path(log_file_dir).mkdir(exist_ok=True)

# Define paths
pypsa_eur_path = pathlib.Path(base_path, "pypsa-eur")

parser = argparse.ArgumentParser(description="Script to process configuration path")

# Step 2: Add a command-line argument for the config file
parser.add_argument(
    "--configfile", type=str, required=True, help="Path to the configuration file"
)

# Step 3: Parse the arguments
args = parser.parse_args()

# Step 4: Use the command-line argument to set the configfile
configfile = pathlib.Path(args.configfile)

# The rest of your code here...
print(f"Using config file at: {configfile}")

# Open log_output
today_date = str(dt.datetime.now())
log_output_file = open(log_file_dir / f"output_pypsa_eur_{today_date[:10]}.txt", "w")

subprocess.run(["snakemake", "--unlock"])

log_output_file.write("        \n")
log_output_file.write("        \n")
log_output_file.write("Execute model run \n")
print("Execute model run \n")

if configfile.name == "pypsa-eur-sec-2-lv1-3h.yaml":
    subprocess.run(
        [
            "snakemake",
            "-call",
            "all",
            "--cores",
            "all",
            "--printshellcmds",
            "--configfile",
            str(configfile),
        ]
    )
elif configfile.name == "pypsa-eur-elec-10-lvopt-3h.yaml":
    subprocess.run(
        [
            "snakemake",
            "-call",
            "solve_elec_networks",
            "--cores",
            "all",
            "--printshellcmds",
            "--configfile",
            str(configfile),
        ]
    )
elif configfile.name in [
    "pypsa-eur-elec-20-lv1-3h-op.yaml",
    "pypsa-eur-elec-20-lv1-3h-op-ucconv.yaml",
]:
    subprocess.run(
        [
            "snakemake",
            "-call",
            "results/networks/elec_s_20_ec_lv1_24h_op.nc",
            "--cores",
            "all",
            "--printshellcmds",
            "--configfile",
            str(configfile),
        ]
    )

log_output_file.close()

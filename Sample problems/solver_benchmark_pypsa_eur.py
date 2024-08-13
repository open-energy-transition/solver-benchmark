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

import pathlib
import os
import subprocess
import datetime as dt
import pypsa

# Initial configurations

# Set the paths
base_path = pathlib.Path(__file__).parent
log_file_dir = base_path / "logs"

# Ensure the logs directory exists
pathlib.Path(log_file_dir).mkdir(exist_ok=True)

# Define paths
pypsa_eur_path = pathlib.Path(base_path, "pypsa-eur")
config_path = pathlib.Path(base_path, "config", "config_1.yaml")

# Open log_output
today_date = str(dt.datetime.now())
log_output_file = open(log_file_dir / f'output_pypsa_eur_{today_date[:10]}.txt', 'w')

subprocess.run(["snakemake", "--unlock"])

log_output_file.write("        \n")
log_output_file.write("        \n")
log_output_file.write("Execute model run \n")
print("Execute model run \n")

if config_path.name == "config_1.yaml":
    subprocess.run([
        "snakemake", "-call", "all", "--cores", "all",
        "--printshellcmds", "--configfile", str(config_path)
    ])
elif config_path.name == "config_2.yaml":
    subprocess.run([
        "snakemake", "-call", "solve_elec_networks", "--cores", "all",
        "--printshellcmds", "--configfile", str(config_path)
    ])

log_output_file.close()

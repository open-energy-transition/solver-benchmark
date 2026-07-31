# Generating LP files from optimization problems setup for openTEPES

The **Open Generation, Storage, and Transmission Operation and Expansion Planning Model with RES and ESS (openTEPES)** has been developed at the [Instituto de Investigación Tecnológica (IIT)](https://www.iit.comillas.edu/index.php.en) of the [Universidad Pontificia Comilla](https://www.comillas.edu/en/>).

The **openTEPES** model presents a decision support system for defining the **integrated generation, storage, and transmission resource planning** (IRP, GEP+SEP+TEP) -**Capacity Expansion Planning** (CEP) or **Integrated Resource Planning** (IRP)- of a **large-scale electric system** at a tactical level (i.e., time horizons of 5-30 years),
defined as a set of **generation, storage, and (electricity, hydrogen, and heat) networks dynamic investment decisions for multiple future years**. It is a tool for energy system planners for supporting the energy transition towards a **decarbonized, reliable, and affordable energy system**.

The [openTEPES complete documentation](https://opentepes.readthedocs.io/en/latest/index.html) presents the input data, output results, mathematical formulation, download and installation, and the research projects where the model has been used.

To create the MPS file for an optimization problem from openTEPES, you can follow these steps:

- install openTEPES as a Python library using ``pip install opentepes`` or by cloning the repository from GitHub (https://github.com/IIT-EnergySystemModels/openTEPES) and installing it locally.
- modify the ``openTEPES_ProblemSolving.py`` module to select the MPS format of the output file by substituting the string ``openTEPES_{CaseName}_{p}_{sc}_{st}.lp`` with ``openTEPES_{CaseName}_{p}_{sc}_{st}.mps``. This will create a MPS file with no symbolic labels for the variables and constraints.
- run the case study selecting the fifth option ``Would you like to write log information (seconds and rows) to console?`` to ``Yes`` to crete the MPS file in the case folder.

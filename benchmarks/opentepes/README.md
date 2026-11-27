# Generating the openTEPES problems

[openTEPES](https://opentepes.readthedocs.io/en/latest/index.html) is a model for the integrated planning of generation, storage and transmission of large electric systems, developed at the [Instituto de Investigación Tecnológica](https://www.iit.comillas.edu/index.php.en) of the [Universidad Pontificia Comillas](https://www.comillas.edu/en/). To create the MPS file of a case:

1. Install openTEPES with `pip install opentepes`, or from its [repository](https://github.com/IIT-EnergySystemModels/openTEPES).
2. In `openTEPES_ProblemSolving.py`, replace `openTEPES_{CaseName}_{p}_{sc}_{st}.lp` with `openTEPES_{CaseName}_{p}_{sc}_{st}.mps`, so that the problem is written as an MPS file, without the names of the variables and constraints.
3. Run the case, answering `Yes` to the fifth question, `Would you like to write log information (seconds and rows) to console?`. openTEPES writes the MPS file to the case folder.

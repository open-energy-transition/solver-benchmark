# Generating MPS Files from IESA-Opt-NL Model

This guide explains how to generate MPS files from the IESA-Opt-NL model using AIMMS and Gurobi.


## Prerequisites

1. **Download AIMMS**  
   - Visit [AIMMS website](https://aimms.com) and apply for a free academic license.

2. **Download Gurobi**  
   - Visit [Gurobi website](https://www.gurobi.com) and apply for a free academic license.

3. **Clone the IESA-Opt-NL Repository**  
   - Run:  
     ```bash
     git clone https://github.com/IESA-Opt/IESA-Opt-N
     ```
   - Navigate to the cloned directory.


## Steps to Generate MPS Files

1. **Open the Model**  
   - Either:
     - Double-click `IESA-Opt-N.aimms`, **or**
     - Open AIMMS and load the file manually.

2. **Configure Gurobi Solver Options**  
   - In AIMMS, go to **Solver Options** for Gurobi.
   - Enable: Generate MPS at first solve

3. **Load Default Database**  
   - In the AIMMS user interface, load the default database.

4. **Solve the Model**  
   - Click **Solve Transition** in the interface.

5. **Locate the MPS File**  
   - The MPS file will be saved in the root folder of the model, next to `IESA-Opt-N.aimms`.

## Notes
- Ensure that your academic licenses for AIMMS and Gurobi are active.
- The generated MPS file can be used for benchmarking or solver testing.
- The temporal reoslution of the model can be modified by selecting hours-grouping in the user interface. 
- The different geographical resolutions are not included. 

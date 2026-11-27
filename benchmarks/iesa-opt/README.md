# Generating the IESA-Opt-NL problems

The MPS files of the IESA-Opt-NL model are generated with AIMMS and Gurobi, which both offer free academic licenses.

1. Install [AIMMS](https://aimms.com) and [Gurobi](https://www.gurobi.com), with active licenses.
2. Clone the model's repository:

   ```bash
   git clone https://github.com/IESA-Opt/IESA-Opt-N
   ```

3. Open `IESA-Opt-N.aimms` in AIMMS.
4. In the **Solver Options** of Gurobi, enable **Generate MPS at first solve**.
5. In the user interface, load the default database.
6. Click **Solve Transition**. AIMMS writes the MPS file to the root folder of the model, next to `IESA-Opt-N.aimms`.

To change the temporal resolution, select another grouping of hours in the user interface. The model has a single geographical resolution.

import json
import sys
from time import time

import linopy


def main(solver_name, input_file):
    print(f"Solver: {solver_name} | Input File: {input_file}")
    # Load the Linopy model from the NetCDF file
    model = linopy.read_netcdf(input_file)

    # Solve the model with the specified solver
    start_time = time()
    status, condition = model.solve(solver_name=solver_name)
    runtime = time() - start_time

    results = {
        "runtime": runtime,
        "status": status,
        "condition": condition,
        "objective": model.objective.value,
    }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python run_solver.py <solver_name> <input_file>")
        sys.exit(1)

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    main(solver_name, input_file)

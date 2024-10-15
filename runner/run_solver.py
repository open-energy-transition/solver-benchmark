import json
import sys
from pathlib import Path
from time import time

import linopy
from linopy.solvers import SolverName


def get_solver(solver_name):
    try:
        solver_enum = SolverName(solver_name.lower())
    except ValueError:
        raise ValueError(f"Solver '{solver_name}' is not recognized")

    solver_class = getattr(linopy.solvers, solver_enum.name)
    return solver_class()


def main(solver_name, input_file):
    problem_file = Path(input_file)
    solver = get_solver(solver_name)

    start_time = time()
    res = solver.solve_problem(problem_fn=problem_file)
    runtime = time() - start_time

    results = {
        "runtime": runtime,
        "status": res.status.status.value,
        "condition": res.status.termination_condition.value,
        "objective": res.solution.objective,
    }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python run_solver.py <solver_name> <input_file>")
        sys.exit(1)

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    main(solver_name, input_file)

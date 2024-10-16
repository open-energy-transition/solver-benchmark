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


def select_solver_method(solver_name, solver, problem_file):
    if solver_name == "glpk":
        solution_fn = f"runner/solution/{problem_file.stem}.sol"
        return lambda: solver.solve_problem(
            problem_fn=problem_file, solution_fn=solution_fn
        )
    else:
        return lambda: solver.solve_problem(problem_fn=problem_file)


def main(solver_name, input_file):
    problem_file = Path(input_file)
    solver = get_solver(solver_name)
    solve_problem = select_solver_method(solver_name, solver, problem_file)

    start_time = time()
    solver_result = solve_problem()
    runtime = time() - start_time

    results = {
        "runtime": runtime,
        "status": solver_result.status.status.value,
        "condition": solver_result.status.termination_condition.value,
        "objective": solver_result.solution.objective,
    }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python run_solver.py <solver_name> <input_file>")
        sys.exit(1)

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    main(solver_name, input_file)

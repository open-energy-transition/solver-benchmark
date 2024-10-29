import json
import sys
from pathlib import Path
from time import time

import linopy
import numpy as np
from linopy.solvers import SolverName


def get_solver(solver_name):
    try:
        solver_enum = SolverName(solver_name.lower())
    except ValueError:
        raise ValueError(f"Solver '{solver_name}' is not recognized")

    solver_class = getattr(linopy.solvers, solver_enum.name)

    seed_options = {
        "highs": {"random_seed": 0},
        "glpk": {"seed": 0},
        "gurobi": {"seed": 0},
        "scip": {
            "randomization/randomseedshift": 0,
        },
    }

    if solver_name.lower() in seed_options:
        return solver_class(**seed_options[solver_name.lower()])
    else:
        return solver_class()


def main(solver_name, input_file):
    problem_file = Path(input_file)
    solver = get_solver(solver_name)
    solution_fn = (
        Path(__file__).parent / "solution/{problem_file.stem}-{solver_name}.sol"
    )

    start_time = time()
    solver_result = solver.solve_problem(
        problem_fn=problem_file,
        solution_fn=solution_fn,
    )
    runtime = time() - start_time
    solver_model = solver_result.solver_model
    duality_gap = None
    max_integrality_violation = None

    if solver_name == "scip":
        duality_gap = solver_model.getGap()
    elif solver_name == "gurobi":
        if solver_model.IsMIP:
            duality_gap = solver_model.MIPGap
    elif solver_name == "glpk":
        # GLPK does not provide a solver model with duality gap information.
        duality_gap = None
    elif solver_model:
        info = solver_model.getInfo()
        duality_gap = info.mip_gap if hasattr(info, "mip_gap") else None
    # We are not using solver_result.solver_model.getInfo() because it works for HiGHS but not for other solvers.
    primal_values = solver_result.solution.primal
    integrality_violations = [
        abs(val - round(val)) for val in primal_values if val is not None
    ]
    if integrality_violations:
        max_integrality_violation = np.max(integrality_violations)

    results = {
        "runtime": runtime,
        "status": solver_result.status.status.value,
        "condition": solver_result.status.termination_condition.value,
        "objective": solver_result.solution.objective,
        "duality_gap": duality_gap,
        "max_integrality_violation": max_integrality_violation,
    }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python run_solver.py <solver_name> <input_file>")
        sys.exit(1)

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    main(solver_name, input_file)

import json
import sys
from pathlib import Path
from time import time

import numpy as np
from linopy import solvers
from linopy.solvers import SolverName


def get_solver(solver_name):
    try:
        solver_enum = SolverName(solver_name.lower())
    except ValueError:
        raise ValueError(f"Solver '{solver_name}' is not recognized")

    solver_class = getattr(solvers, solver_enum.name)

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


def is_mip_problem(solver_model, solver_name):
    if solver_name == "scip":
        if solver_model.getNIntVars() > 0 or solver_model.getNBinVars() > 0:
            return True
        return False
    elif solver_name == "gurobi":
        return solver_model.IsMIP
    elif solver_name == "highs":
        info = solver_model.getInfo()
        return info.mip_node_count >= 0


def calculate_integrality_violation(primal_values) -> float:
    """Calculate the maximum integrality violation from primal values."""
    integrality_violations = [
        abs(val - round(val)) for val in primal_values if val is not None
    ]
    return np.max(integrality_violations) if integrality_violations else None


def get_duality_gap(solver_model, solver_name: str):
    """Retrieve the duality gap for the given solver model, if available.
    Note: GLPK does not provide a solver model in solver_result, so we cannot calculate the mip_gap.
    """

    if solver_name == "scip":
        return solver_model.getGap()
    elif solver_name == "gurobi" and solver_model.IsMIP:
        return solver_model.MIPGap
    elif solver_name == "highs" and solver_model:
        info = solver_model.getInfo()
        return info.mip_gap if hasattr(info, "mip_gap") else None
    return None


def main(solver_name, input_file):
    problem_file = Path(input_file)
    solver = get_solver(solver_name)
    solution_dir = Path(__file__).parent / "solution"
    solution_dir.mkdir(parents=True, exist_ok=True)
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

    if is_mip_problem(solver_model, solver_name):
        duality_gap = get_duality_gap(solver_model, solver_name)
        max_integrality_violation = calculate_integrality_violation(
            # We are not using solver_result.solver_model.getInfo() because it works for HiGHS but not for other solvers.
            solver_result.solution.primal
        )

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

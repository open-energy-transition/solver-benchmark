import collections.abc
import json
import os
import subprocess
import sys
import time
from enum import Enum
from pathlib import Path
from time import perf_counter
from traceback import format_exc

import pandas as pd
from linopy import solvers
from linopy.solvers import SolverName


class HighsVariant(str, Enum):
    HIPO = "highs-hipo"
    HIPO_32 = "highs-hipo-32"
    HIPO_64 = "highs-hipo-64"
    HIPO_128 = "highs-hipo-128"
    HIPO_IPM = "highs-ipm"

    # cli args returns a list of command line arguments for the HiGHS binary.
    def cli_args(self) -> collections.abc.Iterable[str]:
        args = {
            "solver": "hipo",
            "run_crossover": "choose",
        }
        if self == HighsVariant.HIPO_IPM:
            args["solver"] = "ipx"

        return [f"--{k}={v}" for k, v in args.items()]

    # options returns the contents for the HiGHS options file.
    # passed to the HiGHS binary via --options_file=<file>
    def options(self) -> str:
        options = {}
        match self:
            case HighsVariant.HIPO_32:
                options["hipo_block_size"] = 32
            case HighsVariant.HIPO_64:
                options["hipo_block_size"] = 64
            case HighsVariant.HIPO_128:
                options["hipo_block_size"] = 128
            case HighsVariant.HIPO:
                options["hipo_block_size"] = 64
                options["hipo_metis_no2hop"] = "true"
        return "\n".join(f"{k} = {v}" for k, v in options.items())


# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


def get_solver(solver_name):
    solver_name = solver_name.lower()
    solver_enum = SolverName(solver_name)

    solver_class = getattr(solvers, solver_enum.name)

    mip_gap = 1e-4  # Tolerance for the relative duality gap for MILPs
    seed_options = {
        "highs": {"random_seed": 0, "mip_rel_gap": mip_gap},
        "glpk": {"seed": 0, "mipgap": mip_gap},
        "gurobi": {"seed": 0, "MIPGap": mip_gap},
        "scip": {"randomization/randomseedshift": 0, "limits/gap": mip_gap},
        "cbc": {
            "randomCbcSeed": 1,  # 0 indicates time of day
            "ratioGap": mip_gap,
        },
        "cplex": {
            "randomseed": 0,
            "mip.tolerances.mipgap": mip_gap,
        },
    }

    return solver_class(**seed_options.get(solver_name, {}))


def is_mip_problem(solver_model, solver_name):
    """
    Determines if a given solver model is a Mixed Integer Programming (MIP) problem.
    """
    if solver_name == "scip":
        if solver_model.getNIntVars() > 0 or solver_model.getNBinVars() > 0:
            return True
        return False
    elif solver_name == "gurobi":
        return solver_model.IsMIP
    elif solver_name == "highs":
        info = solver_model.getInfo()
        return info.mip_node_count >= 0
    elif solver_name == "cplex":
        # Check if any variables are integer or binary
        var_types = solver_model.variables.get_types()
        return any(t in ("I", "B") for t in var_types)
    elif solver_name in {"glpk", "cbc"}:
        # These solvers do not provide a solver model in the solver result,
        # so MIP problem detection is not possible.
        # TODO preprocess benchmarks and add this info to metadata
        return False
    else:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")


def calculate_integrality_violation(
    integer_vars: pd.Series, primal_values: pd.Series
) -> float:
    """Calculate the maximum integrality violation from primal values.
    We only care about Integer vars, not SemiContinuous or SemiInteger, following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888
    Note:
        We are not using solver_result.solver_model.getInfo() because it works for HiGHS but not for other solvers
    """
    p = primal_values.loc[primal_values.index.intersection(integer_vars)]
    return max((p - p.round()).abs())


def get_duality_gap(solver_model, solver_name: str):
    """Retrieve the duality gap for the given solver model, if available."""
    if solver_name == "scip":
        return solver_model.getGap()
    elif solver_name == "gurobi":
        return solver_model.MIPGap
    elif solver_name == "highs":
        return getattr(solver_model.getInfo(), "mip_gap", None)
    elif solver_name == "cbc":
        return getattr(solver_model, "mip_gap", None)
    elif solver_name == "glpk":
        # GLPK does not have a way to retrieve the duality gap from python
        return None
    elif solver_name == "cplex":
        return solver_model.solution.MIP.get_mip_relative_gap()
    else:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")


def get_milp_metrics(input_file, solver_result):
    """Uses HiGHS to read the problem file and compute max integrality violation and
    duality gap.
    """
    try:
        if highspy is not None:
            h = highspy.Highs()
            h.readModel(input_file)
            integer_vars = {
                h.variableName(i)
                for i in range(h.numVariables)
                if h.getColIntegrality(i)[1] == highspy.HighsVarType.kInteger
            }
            if integer_vars:
                duality_gap = get_duality_gap(solver_result.solver_model, solver_name)
                max_integrality_violation = calculate_integrality_violation(
                    integer_vars, solver_result.solution.primal
                )
                return duality_gap, max_integrality_violation
    except Exception:
        print(
            f"ERROR obtaining milp metrics for {input_file}: {format_exc()}",
            file=sys.stderr,
        )
    return None, None


def get_reported_runtime(solver_name, solver_model) -> float | None:
    """Get the solving runtime as reported by the solver from the solver's Python object."""
    try:
        match solver_name:
            case "highs":
                return solver_model.getRunTime()
            case "scip":
                return solver_model.getSolvingTime()
            case "cbc":
                return solver_model.runtime
            case "gurobi":
                return solver_model.Runtime
            case "cplex":
                return None
            case _:
                print(f"WARNING: cannot obtain reported runtime for {solver_name}")
                return None
    except Exception:
        print(f"ERROR obtaining reported runtime: {format_exc()}", file=sys.stderr)
    return None


def run_highs_hipo_solver(input_file, solver_version, highs_variant: HighsVariant):
    """
    Run the HiGHS-HiPO solver directly using the binary with variant-specific arguments
    """
    import tempfile

    # check if we are root
    if os.getuid() == 0:
        # VM path
        highs_hipo_binary = "/opt/highs-hipo-workspace/HiGHS/build/bin/highs"
    else:
        highs_hipo_binary = f"{os.getenv('HOME')}/oet/solver-benchmark/highs-installs/highs-hipo-workspace/HiGHS/build/bin/highs"

    solution_dir = Path(__file__).parent / "solutions"
    solution_dir.mkdir(parents=True, exist_ok=True)

    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    output_filename = f"{Path(input_file).stem}-{solver_name}-{solver_version}"
    solution_fn = solution_dir / f"{output_filename}.sol"
    log_fn = logs_dir / f"{output_filename}.log"

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            prefix=highs_variant.value,
            suffix=".options",
            delete=False,
            delete_on_close=False,
        ) as options_file:
            options_file.write(highs_variant.options())
            options_file.flush()

            solver_args = list(highs_variant.cli_args())
            solver_args.append(f"--options_file={options_file.name}")

        command = [
            highs_hipo_binary,
            *solver_args,
            str(Path(input_file).resolve()),
            f"--solution_file={solution_fn}",
        ]

        # Run the command and capture the output
        start_time = time.perf_counter()
        try:
            print(f"running command {command}")
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False,
                encoding="utf-8",
            )
            runtime = time.perf_counter() - start_time

            # Write stdout and stderr to log file
            with open(log_fn, "w") as f:
                f.write(f"Command: {' '.join(command)}\n")
                f.write(f"Return code: {result.returncode}\n\n")
                f.write("STDOUT:\n")
                f.write(result.stdout)
                f.write("\n\nSTDERR:\n")
                f.write(result.stderr)

            if result.returncode != 0:
                return {
                    "runtime": runtime,
                    "reported_runtime": runtime,
                    "status": "ER",
                    "condition": "Error",
                    "objective": None,
                    "duality_gap": None,
                    "max_integrality_violation": None,
                }
            else:
                # Parse HiGHS output to extract objective value
                objective = None
                model_status = "ER"
                for line in reversed(result.stdout.splitlines()):
                    if objective is None:
                        # Old format:
                        if "Objective value" in line and ":" in line:
                            try:
                                objective = float(line.split(":")[-1].strip())
                            except (ValueError, IndexError):
                                pass
                        # New format: "
                        elif "(objective)" in line:
                            try:
                                objective = float(line.split("(objective)")[0].strip())
                            except (ValueError, IndexError):
                                pass

                    if model_status == "ER":
                        # Old format:
                        if "Model status" in line and ":" in line:
                            try:
                                model_status = line.split(":")[-1].strip()
                            except (ValueError, IndexError):
                                pass
                        # New format:
                        elif line.strip().startswith("Status") and ":" not in line:
                            try:
                                parts = line.split()
                                if len(parts) >= 2:
                                    status_value = parts[-1]
                                    if status_value in [
                                        "Optimal",
                                        "Infeasible",
                                        "Unbounded",
                                    ]:
                                        model_status = status_value
                            except (ValueError, IndexError):
                                pass

                    # Break early once we've found both values
                    if objective is not None and model_status != "ER":
                        break

                if objective is not None and model_status in ["Optimal", "Infeasible"]:
                    status = "ok"
                else:
                    status = "warning"

                return {
                    "runtime": runtime,
                    "reported_runtime": runtime,
                    "status": status,
                    # Model status        : Optimal
                    "condition": model_status,
                    "objective": objective,
                    "duality_gap": None,  # Not available from command line output
                    "max_integrality_violation": None,  # Not available from command line output
                }
        except Exception as e:
            runtime = time.perf_counter() - start_time
            # Write error to log file
            with open(log_fn, "w") as f:
                f.write(f"Command: {' '.join(command)}\n")
                f.write(f"Exception: {str(e)}\n")

            return {
                "runtime": runtime,
                "reported_runtime": runtime,
                "status": "error",
                "condition": "Error",
                "objective": None,
                "duality_gap": None,
                "max_integrality_violation": None,
            }
    finally:
        pass
        # Clean up temporary options file
        # if options_file is not None:
        #     try:
        #         os.unlink(options_file.name)
        #     except OSError:
        #         pass


def main(solver_name, input_file, solver_version):
    problem_file = Path(input_file)

    # Handle highs-hipo solver variants separately
    try:
        highs_variant = HighsVariant(solver_name.lower())
        results = run_highs_hipo_solver(input_file, solver_version, highs_variant)
        print(json.dumps(results))
        return
    except ValueError as e:
        # re-raise the error if it isn't expected.
        # we want to continue only if the error is about invalid HighsVariant
        if "is not a valid HighsVariant" not in str(e):
            raise e

    solver = get_solver(solver_name)

    solution_dir = Path(__file__).parent / "solutions"
    solution_dir.mkdir(parents=True, exist_ok=True)

    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    output_filename = f"{Path(input_file).stem}-{solver_name}-{solver_version}"

    solution_fn = solution_dir / f"{output_filename}.sol"
    log_fn = logs_dir / f"{output_filename}.log"

    try:
        # We measure runtime here and not of this entire script because lines like
        # `import linopy` take a long (and varying) amount of time
        start_time = perf_counter()
        solver_result = solver.solve_problem(
            problem_fn=problem_file, solution_fn=solution_fn, log_fn=log_fn
        )
        runtime = perf_counter() - start_time

        duality_gap, max_integrality_violation = get_milp_metrics(
            input_file, solver_result
        )

        results = {
            "runtime": runtime,
            "reported_runtime": get_reported_runtime(
                solver_name, solver_result.solver_model
            ),
            "status": solver_result.status.status.value,
            "condition": solver_result.status.termination_condition.value,
            "objective": solver_result.solution.objective,
            "duality_gap": duality_gap,
            "max_integrality_violation": max_integrality_violation,
        }
    except Exception:
        print(f"ERROR running solver: {format_exc()}", file=sys.stderr)
        results = {
            "runtime": None,
            "reported_runtime": None,
            "status": "ER",
            "condition": None,
            "objective": None,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python run_solver.py <solver_name> <input_file> <solver_version>")
        sys.exit(1)

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    solver_version = sys.argv[3]
    main(solver_name, input_file, solver_version)

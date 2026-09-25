"""CBC solver adapter: result-metric accessors.

linopy runs CBC as a command-line program, so there is no native model to
query: `model` is linopy's small `CbcModel(mip_gap, runtime)` result, and
the duality gap and variable values are read from the log and solution
files CBC writes instead.
"""

import re
from pathlib import Path
from typing import Any

# highspy is only installed in the HiGHS, CBC and tests solver environments
try:
    import highspy as _highspy
except ModuleNotFoundError:
    _highspy = None


def is_mip(model: Any) -> bool | None:
    """Always None: CBC's result object doesn't say, see `integer_values`."""
    return None


def duality_gap(model: Any, log_fn: Path) -> float | None:
    """CBC's relative MIP gap, computed from its log.

    CBC's own ``Gap:`` line (which linopy reads into `model.mip_gap`) is
    rounded to two decimals, and is only printed when CBC stops before
    closing the gap. So instead:

    - if the log has both ``Objective value:`` and ``Lower bound:`` (CBC
      stopped at its gap tolerance or a limit), the gap is
      ``|objective - bound| / |objective|``;
    - if it has neither bound nor early stop, but CBC reports an optimal
      solution after completing its search, the tree was fully explored
      and the gap is 0;
    - otherwise it's unknown (None).
    """
    try:
        log = Path(log_fn).read_text()
    except OSError:
        return None

    objective = re.search(r"^Objective value:\s+(\S+)", log, re.MULTILINE)
    bound = re.search(r"^Lower bound:\s+(\S+)", log, re.MULTILINE)
    if objective and bound:
        objective_value, bound_value = float(objective.group(1)), float(bound.group(1))
        if objective_value == 0:
            return 0.0 if bound_value == 0 else None
        return abs(objective_value - bound_value) / abs(objective_value)
    if "Result - Optimal solution found" in log and "Search completed" in log:
        return 0.0
    return None


def reported_runtime(model: Any) -> float:
    """CBC's own reported solve time."""
    return model.runtime


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in CBC's solution file.

    CBC's solution file doesn't mark which variables are integer, so the
    problem file is read with HiGHS to find them (as linopy itself does to
    parse CBC's output). Returns None if highspy isn't installed, CBC found
    no feasible solution, or the file lacks any integer variable's value.
    """
    if _highspy is None:
        return None
    h = _highspy.Highs()
    h.silent()
    h.readModel(str(problem_fn))
    lp = h.getLp()
    # Not strict: HiGHS leaves `integrality_` empty for an LP, so this is empty
    integer_names = {
        name
        for name, var_type in zip(lp.col_names_, lp.integrality_, strict=False)
        if var_type == _highspy.HighsVarType.kInteger
    }
    if not integer_names:
        return {}

    with Path(solution_fn).open() as f:
        # e.g. "Optimal - objective value 1.5" or "Infeasible - objective value 0"
        if "infeasible" in f.readline().lower():
            return None
        values = {}
        for line in f:
            # Each line is "<index> <name> <value> <reduced cost>", prefixed
            # with "**" when the entry violates its bounds.
            tokens = line.replace("**", "").split()
            if len(tokens) >= 3 and tokens[1] in integer_names:
                values[tokens[1]] = float(tokens[2])
    # Only report a complete set: a partial one would understate the violation
    return values if values.keys() == integer_names else None

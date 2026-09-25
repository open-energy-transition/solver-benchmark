"""GLPK solver adapter: result-metric accessors.

linopy runs GLPK as a command-line program (`glpsol`) and returns no solver
model, so MIP detection and variable values come from the report GLPK
writes to the solution file instead.
"""

import re
from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool | None:
    """Always None: GLPK returns no model, see `integer_values`."""
    return None


def duality_gap(model: Any) -> float | None:
    """Always None: GLPK doesn't expose a duality gap from Python."""
    return None


def reported_runtime(model: Any) -> float | None:
    """Always None: GLPK doesn't return a solver model to read a runtime from."""
    return None


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in GLPK's solution report.

    The report (`glpsol --output`) starts with a header such as::

        Columns:    582 (2 integer, 2 binary)
        Status:     INTEGER OPTIMAL

    followed by a rows table and a columns table, where an integer column
    is marked with ``*`` before its value. A name too long for its column
    is printed on its own line, with the rest of the entry on the next one.
    Returns None if GLPK found no integer feasible solution, or not every
    integer column counted in the header could be parsed.
    """
    with open(solution_fn) as f:
        lines = f.read().splitlines()

    header = {}
    for line in lines:
        if not line.strip():
            break
        key, _, value = line.partition(":")
        header[key.strip()] = value.strip()
    num_integer = re.search(r"(\d+) integer", header.get("Columns", ""))
    if num_integer is None:
        return {}
    status = header.get("Status", "")
    if "UNDEFINED" in status or "EMPTY" in status:
        return None

    table_start = next(i for i, line in enumerate(lines) if "Column name" in line)
    values = {}
    i = table_start + 2  # skip the header and "------" lines
    while i < len(lines) and lines[i].strip():
        tokens = lines[i].split()
        if len(tokens) == 2:  # long name: the rest is on the next line
            i += 1
            tokens += lines[i].split()
        if tokens[2] == "*":
            values[tokens[1]] = float(tokens[3])
        i += 1
    # Only report a complete set: a partial one would understate the violation
    return values if len(values) == int(num_integer.group(1)) else None

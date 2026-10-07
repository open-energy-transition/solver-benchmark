"""Print the version of a solver as the current env loads it.

Run inside a solver env, e.g. ``python -m runner.utils.solvers scip``. See
`runner.utils.env.check_solver_versions`.
"""

import sys

from . import SOLVER_ADAPTERS

if __name__ == "__main__":
    print(SOLVER_ADAPTERS[sys.argv[1]].solver_version())

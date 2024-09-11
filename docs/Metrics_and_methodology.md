# Benchmarking metrics and methodology

## Metrics

We record the following metrics for each benchmark and solver combination:

1. **Runtime**: of the `linopy.Model.solve()` call to the solver, mean over `N` iterations
1. **Peak memory consumption**: of the script `runner/run_solver.py` that uses linopy to call the solver, as reported by `/usr/bin/time -f %M`
1. **Status**: OK, TO (timeout), ER (error)
1. **Termination condition**: as returned by the solver, for example optimal, infeasible, unbounded, …
1. **Objective value**: (a floating point value) the optimal objective value

## Methodology

Given a time out `T` (seconds) and a number of iterations `N`, the benchmark runner operates as follows:

- The benchmark LP/NC files are downloaded from Zenodo (TODO, currently Google Drive)
- For each benchmark and solver combination, the runner calls `runner/run_solver.py`, which imports the input file into linopy and calls `linopy.Model.solve()` with the chosen solver
- `run_solver.py` reports the time taken for the `solve()` call, along with the status, termination condition, and objective value returned by the solver
- The runner uses `/usr/bin/time` to measure the peak memory usage of the `run_solver.py` script
    - While this will include the memory usage of linopy, we expect this to be constant across all solvers, so it will not affect relative rankings
- The above is repeated `N` times, and the mean and standard deviation of runtime and memory usage are computed
- The value from the last iteration is used for other metrics such as status, termination condition, and objective value
- If the solver errors in any iteration, then the `(benchmark, solver)` combination is marked with status `ER` and no further iterations are performed
- If the solver takes longer than `T`s in any iteration, then the `(benchmark, solver)` combination is marked with status `TO` and no further iterations are performed

Future improvements:

- The above can be extended for a list of possible machine configurations (num vCPUs, amount of RAM), and these are stored along with the metrics in order to evaluate performace scaling w.r.t. computational power
- Instead of using NC files and linopy as a solver interface, `run_solver.py` can work on LP files and directly call the solvers using their CLI / Python API
    - Advantages: LP files are more universally used; memory and time overhead of linopy are removed from results

# Benchmarking Metrics and Methodology

## Metrics

We record the following metrics for each benchmark and solver combination:

1. **Runtime**: of the `linopy.Model.solve()` call to the solver (we also record the solving runtime reported by the solver when available)
1. **Peak memory consumption**: of the script `runner/run_solver.py` that uses linopy to call the solver, as reported by `/usr/bin/time -f %M`
1. **Status**: OK, TO (timeout), OOM (out of memory), ER (error)
1. **Termination condition**: as returned by the solver, for example optimal, infeasible, unbounded, …
1. **Objective value**: (a floating point value) the optimal objective value

We also record the following metrics in order to verify the solution quality of MILP benchmarks:

1. **Maximum integrality violation**: the maximum absolute difference between the solution of each integer variable and its integer value
1. **Duality gap**: the gap between the two objective bounds for MILPs, which should be below the requested tolerance (`1e-4`). Precisely, if `p` is the primal objective bound (i.e., the incumbent objective value, which is the upper bound for minimization problems), and `d` is the dual objective bound (i.e., the lower bound for minimization problems), then the relative duality gap is defined as `|p - d| / |p|`.

After running benchmarks, we manually check any runs where the above 2 metrics are above `1e-4` for errors.

## Ranking Solvers: SGM

Ranking the overall performance of solvers on a (sub)set of benchmark instances is a difficult problem. We offer the following methods for ranking on our main dashboard:

1. SGM runtime
1. SGM peak memory consumption
1. Number of benchmarks solved

SGM above stands for (normalized) shifted geometric mean, and is a more robust summary metric compared to the arithmetic mean (AM) or geometric mean (GM). Given a set of measured values $t_1, \ldots, t_n$, e.g. runtimes of a solver on a set of benchmarks, the SGM value is defined as:
$$ e^{\sum_{i \in 1..n} \frac{\ln(\max(1, t_i + s))}{n}} - s $$
The SGM differs from the geometric mean becauses it uses a *shift* $s$ and also uses a max with 1. Key features are:
- (S)GM commutes with normalization
- (S)GM is influenced less by large outliers compared to AM
- SGM is influenced less by a small number of outliers compared to GM
- Max with 1 ignores differences on tiny benchmarks

We use a shift of $s = 10$, which is also the shift used by the [Mittlemann benchmark](https://plato.asu.edu/ftp/shgeom.html).

Reference:
- [How not to lie with statistics: The correct way to summarize benchmark results](https://cgi.cse.unsw.edu.au/~cs9242/18/papers/Fleming_Wallace_86.pdf), Fleming and Wallace, 1986.

### When Not to Use SGM

The SGM runtime might be misleading in the case when one solver solves more benchmarks than another but with a runtime of just under the time limit, which will result in very similar SGM values even though the first solver could be much better than the second. In such cases, we offer the possibility of using the following alternate "modes" of computing SGM:

1. **Penalizing TO/OOM/ER by a factor of X**: this mode uses the time-out value for runtime or the maximum available value of memory, multiplied by a factor of X, for benchmark instances that time-out, go out of memory, or error. By using a high factor, this avoids the misleading case above as the second solver will have a much higher SGM value.

1. **Only on intersection of solved benchmarks**: this mode filters the benchmark instances to the subset of instances where all solvers solve successfully. This also avoids the misleading case above, but at the cost of comparing solvers on a smaller subset of benchmarks.

## Methodology

### Key Decisions

Here are the key details of our benchmarking methodology, along with the reasoning behind these decisions:

1. We run benchmarks on publically available cloud virtual machines (VMs). Why?
    - It allows us to run different benchmarks in **parallel**, reducing the total runtime (running all benchmarks and solvers as of May 2025 would take 35 days), and allowing us to scale to a large number of benchmarks and solver versions in the future.
    - It is more **cost-efficient** compared to buying and maintaining a physical machine, or to renting a bare metal cloud server (which require minimum monthly committments, and usually have a lot more CPUs than are used by most solvers).
    - It is also more **automatable**, as we can use infrastructure-as-code to set up as many VMs as we need with minimal manual effort.
    - It is more **transparent**, as anyone can **reproduce** our benchmark results on similar machines using their own cloud accounts.
    - What about **errors** in runtime measurements due to the shared nature of cloud computing?
        - We are aware that runtimes vary depending on the other workloads running on the same cloud zones, and have run experiments to estimate the error in runtime.
        - We run a **reference benchmark** and solver periodically on every benchmark runner and estimate the coefficient of variation of the runtime of this reference benchmark for each VM. All our results have a variation of less than 4%, which is less than the difference in runtimes between 98.8% of pairs of solvers on our benchmark instances. (You can think of this as 99% of our benchmarks should have the same ranking of solvers if run on a bare metal server.)
        - See more details of our error estimation in [this notebook](TODO).
    - It reflects the experience of most energy modellers, who use cloud compute or shared high performance computing clusters. They will most likely not notice a difference of less than 4% in performance between 2 solvers, as this variation is present in all of their computations.

1. We use the Python solver interface [linopy](https://github.com/PyPSA/linopy) to interface with different solvers and the measured runtime is the runtime of the call to `linopy.Model.solve()`. Why?
    - It reduces the need for us to write a Python interface for each solver and version (already 13 as of May 2025, and counting), which would largely be a duplicate of the code in `linopy`.
    - Measuring the runtime of linopy is a consistent definition of runtime, as the reported runtimes by different solvers may be defined differently (e.g., some may include the time taken to parse input files or check solver licenses, while others exclude it).
    - It also does not require trusting that solvers do not (un)intentionally report inaccurate solving runtimes (This can be mitigated to some extent as we comparing reported runtimes to measured runtimes while [analyzing](TODO) benchmark results).
    - It reflects the experience of most energy modellers, who use solver interfaces like linopy or JuMP, and for whom the time taken to parse input files or check licenses matters.

1. We run all solvers using their default options, with the exception that we set a uniform duality gap tolerance of `1e-4`.
    - This reflects the experience of most energy modellers, who are not experts on solvers and will use them out of the box.
    - We expect solver developers to tune their default options to be the most performant configuration of their solver for the average problem.
    - Solver developers have told us that they prefer users to use default options, because often users do a small benchmark to test various options/algorithms and then never update this, and end up using outdated options going forward.
    - Depending on feedback and capacity, we can consider having a few preset option configurations for solvers as submitted by the solver developers if there is strong interest in this.

1. We run benchmarks on linux only. We do not expect a huge difference in solver performance on other operating systems, but adding this feature could be an interesting direction of future work.

### Hardware Configurations

We run benchmarks on the following machine configurations and timeouts:

1. Small and Medium sized benchmark instances are run with a timeout of 1 hour on a GCP `c4-standard-2` VM (1 core (2 vCPU), 7 GB RAM)

1. Large sized benchmark instances are run with a timeout of 10 hours on a GCP `c4-highmem-8` VM (4 cores (8 vCPU), 62 GB RAM)

As a reminder, we classify benchmarks into size categories based on the number of variables in the problem, as follows:

- Small: num vars < 1e4
- Medium: 1e4 ≤ num vars < 1e6
- Large: num vars ≥ 1e6

### Details of the Runner

Given a time out `T` (seconds) and a number of iterations `N`, the benchmark runner `runner/run_benchmarks.py` operates as follows:

- The benchmark LP/NC files are downloaded from a Google Cloud bucket
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

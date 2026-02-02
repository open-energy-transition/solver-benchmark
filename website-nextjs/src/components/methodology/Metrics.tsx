import { useScrollSpy } from "@/hooks/useScrollSpy";
import { MathJax } from "better-react-mathjax";

const HASH_NAME = "metrics";
const Metrics = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 1,
  });

  return (
    <div ref={sectionRef}>
      <div id={HASH_NAME} className="h4 info-pages-heading">
        Metrics
      </div>
      <p>
        We record the following metrics for each benchmark and solver
        combination:
      </p>
      <ol className="list-decimal list-outside ml-6">
        <li className="mb-2">
          <strong>Runtime</strong>: of the <code>linopy.Model.solve()</code>{" "}
          call to the solver (we also record the solving runtime reported by the
          solver when available)
        </li>
        <li className="mb-2">
          <strong>Peak memory consumption</strong>: of the script{" "}
          <code>runner/run_solver.py</code> that uses linopy to call the solver,
          as reported by <code>/usr/bin/time -f %M</code>
        </li>
        <li className="mb-2">
          <strong>Status</strong>: OK, warning, TO (timeout), OOM (out of
          memory), ER (error). Statuses OK and warning are as returned by
          linopy, TO indicates that we terminated the solver when the time limit
          was reached, OOM indicates cases where the solver ran out of memory
          (we set a bound of 95% of available system memory using
          <code>systemd-run</code>), and ER denotes cases where the solver
          returned a non-zero exit code.
        </li>
        <li className="mb-2">
          <strong>Termination condition</strong>: as returned by the solver, for
          example optimal, infeasible, unbounded, …
        </li>
        <li className="mb-2">
          <strong>Objective value</strong>: (a floating point value) the optimal
          objective value
        </li>
      </ol>
      <p>
        We also record the following metrics in order to verify the solution
        quality of MILP benchmarks:
      </p>
      <ol className="list-decimal list-outside ml-6">
        <li className="mb-2">
          <strong>Maximum integrality violation</strong>: the maximum absolute
          difference between the solution of each integer variable and its
          integer value
        </li>
        <li className="mb-2">
          <strong>Duality gap</strong>: the gap between the two objective bounds
          for MILPs, which should be below the requested tolerance (
          <code>1e-4</code>). The duality gap can be used to judge how close the
          returned solution is to the optimal solution, and we set a tolerance
          in order to allow solvers to terminate in a reasonable time period
          when they have found a close-to-optimal solution. Precisely, if{" "}
          <MathJax inline>{"$p$"}</MathJax> is the primal objective bound (i.e.,
          the incumbent objective value, which is the upper bound for
          minimization problems), and <MathJax inline>{"$d$"}</MathJax> is the
          dual objective bound (i.e., the lower bound for minimization
          problems), then the relative duality gap is defined as{" "}
          <MathJax inline>{"$|p - d| / |p|$"}</MathJax>.
        </li>
      </ol>
      <p>
        After running benchmarks, we manually check any runs where the above 2
        metrics are above <code>1e-4</code> for errors. In our results so far,
        no solver had a max integrality violation of above <code>1e-7</code>.
      </p>
    </div>
  );
};

export default Metrics;

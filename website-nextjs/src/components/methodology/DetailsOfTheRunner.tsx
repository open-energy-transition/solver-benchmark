import { useScrollSpy } from "@/hooks/useScrollSpy";
import { MathJax } from "better-react-mathjax";

const HASH_NAME = "details-of-the-runner";
const DetailsOfTheRunner = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 1,
  });

  return (
    <div ref={sectionRef}>
      {/* Content */}
      <h4 id={HASH_NAME} className="info-pages-heading">
        Details of the Runner
      </h4>
      <p>
        Given a time out <MathJax inline>{"$T$"}</MathJax> (seconds) and a
        number of iterations <MathJax inline>{"$N$"}</MathJax>, the benchmark
        runner <code>runner/run_benchmarks.py</code> operates as follows:
      </p>
      <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          The benchmark LP/MPS files are downloaded from a Google Cloud bucket
        </li>
        <li className="mb-2">
          For each benchmark and solver combination, the runner calls
          <code>runner/run_solver.py</code>, which imports the input file into
          linopy and calls <code>linopy.Model.solve()</code> with the chosen
          solver
        </li>
        <li className="mb-2">
          <code>run_solver.py</code> reports the time taken for the{" "}
          <code>solve()</code> call, along with the status, termination
          condition, and objective value returned by the solver
        </li>
        <li className="mb-2">
          <p>
            The runner uses <code>/usr/bin/time</code> to measure the peak
            memory usage of the <code>run_solver.py</code> script
          </p>
          <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
            <li className="mb-2">
              While this will include the memory usage of linopy, we expect this
              to be constant across all solvers, so it will not affect relative
              rankings
            </li>
          </ul>
        </li>
        <li className="mb-2">
          The above is repeated <MathJax inline>{"$N$"}</MathJax> times, and the
          mean and standard deviation of runtime and memory usage are computed
        </li>
        <li className="mb-2">
          The value from the last iteration is used for other metrics such as
          status, termination condition, and objective value
        </li>
        <li className="mb-2">
          If the solver errors in any iteration, then the{" "}
          <code>(benchmark, solver)</code> combination is marked with status{" "}
          <code>ER</code> and no further iterations are performed
        </li>
        <li className="mb-2">
          If the solver takes longer than <MathJax inline>{"$T$"}</MathJax> in
          any iteration, then the
          <code>(benchmark, solver)</code> combination is marked with status{" "}
          <code>TO</code> and no further iterations are performed
        </li>
      </ul>
      <p>Future improvements:</p>
      <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          The above can be extended for a list of possible machine
          configurations (num vCPUs, amount of RAM), and these are stored along
          with the metrics in order to evaluate performance scaling w.r.t.
          computational power
        </li>
      </ul>
    </div>
  );
};

export default DetailsOfTheRunner;

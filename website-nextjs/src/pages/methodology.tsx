import React from "react";
import {
  PageLayout,
  TableOfContents,
  ContentSection,
} from "@/components/info-pages";

const Methodology = () => {
  const tocItems = [
    {
      hash: "#metrics",
      label: "Metrics",
    },
    {
      hash: "#ranking-solvers",
      label: "Ranking Solvers: SGM",
    },
    {
      hash: "#when-not-to-use-sgm",
      label: "When Not to Use SGM",
    },
    {
      hash: "#methodology",
      label: "Methodology",
    },
    {
      hash: "#hardware-configurations",
      label: "Hardware Configurations",
    },
    {
      hash: "#details-of-the-runner",
      label: "Details of the Runner",
    },
  ];

  return (
    <PageLayout
      title="Methodology"
      description="Benchmarking Metrics and Methodology"
    >
      <TableOfContents items={tocItems} />
      <ContentSection>
        <div className="info-pages-content">
          <div className="info-pages-section">
            <h4 id="metrics" className="info-pages-heading">
              Metrics
            </h4>
            <p>
              We record the following metrics for each benchmark and solver
              combination:
            </p>
            <ol className="list-decimal list-outside ml-6">
              <li className="mb-2">
                <strong>Runtime</strong>: of the{" "}
                <code>linopy.Model.solve()</code> call to the solver (we also
                record the solving runtime reported by the solver when
                available)
              </li>
              <li className="mb-2">
                <strong>Peak memory consumption</strong>: of the script{" "}
                <code>runner/run_solver.py</code> that uses linopy to call the
                solver, as reported by <code>/usr/bin/time -f %M</code>
              </li>
              <li className="mb-2">
                <strong>Status</strong>: OK, warning, TO (timeout), OOM (out of
                memory), ER (error). Statuses OK and warning are as returned by
                linopy, TO indicates that we terminated the solver when the time
                limit was reached, OOM indicates cases where the solver ran out
                of memory (we set a bound of 95% of available system memory
                using
                <code>systemd-run</code>), and ER denotes cases where the solver
                returned a non-zero exit code.
              </li>
              <li className="mb-2">
                <strong>Termination condition</strong>: as returned by the
                solver, for example optimal, infeasible, unbounded, …
              </li>
              <li className="mb-2">
                <strong>Objective value</strong>: (a floating point value) the
                optimal objective value
              </li>
            </ol>
            <p>
              We also record the following metrics in order to verify the
              solution quality of MILP benchmarks:
            </p>
            <ol className="list-decimal list-outside ml-6">
              <li className="mb-2">
                <strong>Maximum integrality violation</strong>: the maximum
                absolute difference between the solution of each integer
                variable and its integer value
              </li>
              <li className="mb-2">
                <strong>Duality gap</strong>: the gap between the two objective
                bounds for MILPs, which should be below the requested tolerance
                (<code>1e-4</code>). The duality gap can be used to judge how
                close the returned solution is to the optimal solution, and we
                set a tolerance in order to allow solvers to terminate in a
                reasonable time period when they have found a close-to-optimal
                solution. Precisely, if <code>p</code> is the primal objective
                bound (i.e., the incumbent objective value, which is the upper
                bound for minimization problems), and <code>d</code> is the dual
                objective bound (i.e., the lower bound for minimization
                problems), then the relative duality gap is defined as{" "}
                <code>|p - d| / |p|</code>.
              </li>
            </ol>
            <p>
              After running benchmarks, we manually check any runs where the
              above 2 metrics are above <code>1e-4</code> for errors. In our
              results so far, no solver had a max integrality violation of above{" "}
              <code>1e-5</code>.
            </p>
          </div>

          <div className="info-pages-section">
            <h4 id="ranking-solvers" className="info-pages-heading">
              Ranking Solvers: Shifted Geometric Mean (SGM)
            </h4>
            <p>
              Ranking the overall performance of solvers on a (sub)set of
              benchmark instances is a difficult problem. We offer the following
              methods for ranking on our main dashboard:
            </p>
            <ol className="list-decimal list-outside ml-6">
              <li className="mb-2">SGM runtime</li>
              <li className="mb-2">SGM peak memory consumption</li>
              <li className="mb-2">Number of benchmarks solved</li>
            </ol>
            <p>
              SGM above stands for (normalized) shifted geometric mean, and is a
              more robust summary metric compared to the arithmetic mean (AM) or
              geometric mean (GM). Given a set of measured values t₁, …, tₙ,
              e.g. runtimes of a solver on a set of benchmarks, the SGM value is
              defined as: e^(∑ᵢ₌₁ⁿ ln(max(1, tᵢ + s))/n) - s. The SGM differs
              from the geometric mean because it uses a <em>shift</em>{" "}
              <code>s</code> and also uses a max with 1. Key features are:
            </p>
            <ul className="list-disc list-outside ml-6">
              <li className="mb-2">(S)GM commutes with normalization</li>
              <li className="mb-2">
                (S)GM is influenced less by large outliers compared to AM
              </li>
              <li className="mb-2">
                SGM is influenced less by a small number of outliers compared to
                GM
              </li>
              <li className="mb-2">
                Max with 1 ignores differences in runtimes of less than 1s
              </li>
              <li className="mb-2">
                The shift is used to reduce the impact of a few benchmarks
                having very low runtimes on the overall SGM, reducing the risk
                of ranking highly a solver that is really good on only a small
                handful of benchmarks
              </li>
            </ul>
            <p>
              We use a shift of <code>s = 10</code>, which is also the shift
              used by the{" "}
              <a href="https://plato.asu.edu/ftp/shgeom.html">
                Mittlemann benchmark
              </a>
              .
            </p>
            <p>Reference:</p>
            <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                <a href="https://cgi.cse.unsw.edu.au/~cs9242/18/papers/Fleming_Wallace_86.pdf">
                  How not to lie with statistics: The correct way to summarize
                  benchmark results
                </a>
                , Fleming and Wallace, 1986.
              </li>
            </ul>
          </div>

          <div className="info-pages-section">
            <h4 id="when-not-to-use-sgm" className="info-pages-heading">
              When Not to Use SGM
            </h4>
            <p>
              The SGM runtime might be misleading in the case when one solver
              solves more benchmarks than another but with a runtime of just
              under the time limit, which will result in very similar SGM values
              even though the first solver could be much better than the second.
              In such cases, we offer the possibility of using the following
              alternate &quot;modes&quot; of computing SGM:
            </p>
            <ol className="list-decimal list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                <strong>Penalizing TO/OOM/ER by a factor of X</strong>: this
                mode uses the time-out value for runtime or the maximum
                available value of memory, multiplied by a factor of X, for
                benchmark instances that time-out, go out of memory, or error.
                By using a high factor, this avoids the misleading case above as
                the second solver will have a much higher SGM value.
              </li>
              <li className="mb-2">
                <strong>Only on intersection of solved benchmarks</strong>: this
                mode filters the benchmark instances to the subset of instances
                where all solvers solve successfully. This also avoids the
                misleading case above, but at the cost of comparing solvers on a
                smaller subset of benchmarks.
              </li>
            </ol>
          </div>

          <div className="info-pages-section">
            <h4 id="methodology" className="info-pages-heading">
              Methodology
            </h4>
          </div>

          <div className="info-pages-section">
            <h5 id="key-decisions" className="info-pages-heading">
              Key Decisions
            </h5>
            <p>
              Here are the key details of our benchmarking methodology, along
              with the reasoning behind these decisions:
            </p>
            <ol className="list-decimal list-outside ml-6 text-base leading-relaxed">
              <li className="mb-4">
                <p>
                  We run benchmarks on publicly available cloud virtual machines
                  (VMs). Why?
                </p>
                <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
                  <li className="mb-2">
                    It allows us to run different benchmarks in{" "}
                    <strong>parallel</strong>, reducing the total runtime
                    (running all benchmarks and solvers as of May 2025 would
                    take 35 days), and allowing us to scale to a large number of
                    benchmarks and solver versions in the future.
                  </li>
                  <li className="mb-2">
                    It is more <strong>cost-efficient</strong> compared to
                    buying and maintaining a physical machine, or to renting a
                    bare metal cloud server (which require minimum monthly
                    commitments, and usually have a lot more CPUs than are used
                    by most solvers).
                  </li>
                  <li className="mb-2">
                    It is also more <strong>automatable</strong>, as we can use
                    infrastructure-as-code to set up as many VMs as we need with
                    minimal manual effort.
                  </li>
                  <li className="mb-2">
                    It is more <strong>transparent</strong>, as anyone can{" "}
                    <strong>reproduce</strong> our benchmark results on similar
                    machines using their own cloud accounts.
                  </li>
                  <li className="mb-2">
                    <p>
                      What about <strong>errors</strong> in runtime measurements
                      due to the shared nature of cloud computing?
                    </p>
                    <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
                      <li className="mb-2">
                        We are aware that runtimes vary depending on the other
                        workloads running on the same cloud zones, and have run
                        experiments to estimate the error in runtime.
                      </li>
                      <li className="mb-2">
                        We run a <strong>reference benchmark</strong> and solver
                        periodically on every benchmark runner and estimate the
                        coefficient of variation of the runtime of this
                        reference benchmark for each VM. All our results have a
                        variation of less than 4%, which is less than the
                        difference in runtimes between 98.8% of pairs of solvers
                        on our benchmark instances. (You can think of this as
                        99% of our benchmarks should have the same ranking of
                        solvers if run on a bare metal server.)
                      </li>
                      <li className="mb-2">
                        See more details of our error estimation in this
                        notebook (TODO).
                      </li>
                    </ul>
                  </li>
                  <li className="mb-2">
                    It reflects the experience of most energy modellers, who use
                    cloud compute or shared high performance computing clusters.
                    They will most likely not notice a difference of less than
                    4% in performance between 2 solvers, as this variation is
                    present in all of their computations.
                  </li>
                </ul>
              </li>
              <li className="mb-4">
                <p>
                  We use the Python solver interface{" "}
                  <a href="https://github.com/PyPSA/linopy">linopy</a> to
                  interface with different solvers and the measured runtime is
                  the runtime of the call to <code>linopy.Model.solve()</code>.
                  Why?
                </p>
                <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
                  <li className="mb-2">
                    It reduces the need for us to write a Python interface for
                    each solver and version (already 13 as of May 2025, and
                    counting), which would largely be a duplicate of the code in
                    <code>linopy</code>.
                  </li>
                  <li className="mb-2">
                    Measuring the runtime of linopy is a consistent definition
                    of runtime, as the reported runtimes by different solvers
                    may be defined differently (e.g., some may include the time
                    taken to parse input files or check solver licenses, while
                    others exclude it).
                  </li>
                  <li className="mb-2">
                    It also does not require trusting that solvers do not
                    (un)intentionally report inaccurate solving runtimes (which
                    we mitigate to some extent by comparing reported runtimes to
                    measured runtimes while analyzing benchmark results).
                  </li>
                  <li className="mb-2">
                    It reflects the experience of most energy modellers, who use
                    solver interfaces like linopy or JuMP, and for whom the time
                    taken to parse input files or check licenses matters.
                  </li>
                </ul>
              </li>
              <li className="mb-4">
                <p>
                  We run all solvers using their default options, with two
                  exceptions: the first is that we set a duality gap tolerance
                  of <code>1e-4</code> for all MILP instances.
                </p>
                <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
                  <li className="mb-2">
                    This reflects the experience of a modeller who is not an
                    expert on solvers and will use them out of the box.
                  </li>
                  <li className="mb-2">
                    We expect solver developers to tune their default options to
                    be the most performant configuration of their solver for the
                    average problem.
                  </li>
                  <li className="mb-2">
                    Solver developers have told us that they prefer users to use
                    default options, because often users do a small benchmark to
                    test various options/algorithms and then never update this,
                    and end up using outdated options going forward.
                  </li>
                  <li className="mb-2">
                    Depending on feedback and capacity, we can consider having a
                    few preset option configurations for solvers as submitted by
                    the solver developers if there is strong interest in this.
                  </li>
                </ul>
              </li>
              <li className="mb-4">
                <p>
                  The other exception to the default solver options is that we
                  set a fixed random seed.
                </p>
                <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
                  <li className="mb-2">
                    This is in order to ensure our runtimes are reproducible.
                  </li>
                  <li className="mb-2">
                    We do not average over multiple random seeds for now, in
                    order to save time and costs (and be slightly greener!).
                    This is something we may consider in the future if there is
                    interest and budget for it.
                  </li>
                </ul>
              </li>
              <li className="mb-2">
                We run benchmarks on linux only. We do not expect a huge
                difference in solver performance on other operating systems, but
                adding this feature could be an interesting direction of future
                work.
              </li>
            </ol>
          </div>

          <div className="info-pages-section">
            <h4 id="hardware-configurations" className="info-pages-heading">
              Hardware Configurations
            </h4>
            <p>
              We run benchmarks on the following machine configurations and
              timeouts:
            </p>
            <ol className="list-decimal list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                Small and Medium sized benchmark instances are run with a
                timeout of 1 hour on a GCP <code>c4-standard-2</code> VM (1 core
                (2 vCPU), 7 GB RAM)
              </li>
              <li className="mb-2">
                Large sized benchmark instances are run with a timeout of 10
                hours on a GCP <code>c4-highmem-8</code> VM (4 cores (8 vCPU),
                62 GB RAM)
              </li>
            </ol>
            <p>
              As a reminder, we classify benchmarks into size categories based
              on the number of variables in the problem, as follows:
            </p>
            <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                Small: num vars &lt; <code>1e4</code>
              </li>
              <li className="mb-2">
                Medium: <code>1e4</code> ≤ num vars &lt; <code>1e6</code>
              </li>
              <li className="mb-2">
                Large: num vars ≥ <code>1e6</code>
              </li>
            </ul>
          </div>

          <div className="info-pages-section">
            <h4 id="details-of-the-runner" className="info-pages-heading">
              Details of the Runner
            </h4>
            <p>
              Given a time out <code>T</code> (seconds) and a number of
              iterations <code>N</code>, the benchmark runner{" "}
              <code>runner/run_benchmarks.py</code> operates as follows:
            </p>
            <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                The benchmark LP/MPS files are downloaded from a Google Cloud
                bucket
              </li>
              <li className="mb-2">
                For each benchmark and solver combination, the runner calls
                <code>runner/run_solver.py</code>, which imports the input file
                into linopy and calls <code>linopy.Model.solve()</code> with the
                chosen solver
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
                    While this will include the memory usage of linopy, we
                    expect this to be constant across all solvers, so it will
                    not affect relative rankings
                  </li>
                </ul>
              </li>
              <li className="mb-2">
                The above is repeated <code>N</code> times, and the mean and
                standard deviation of runtime and memory usage are computed
              </li>
              <li className="mb-2">
                The value from the last iteration is used for other metrics such
                as status, termination condition, and objective value
              </li>
              <li className="mb-2">
                If the solver errors in any iteration, then the{" "}
                <code>(benchmark, solver)</code> combination is marked with
                status <code>ER</code> and no further iterations are performed
              </li>
              <li className="mb-2">
                If the solver takes longer than <code>T</code> in any iteration,
                then the
                <code>(benchmark, solver)</code> combination is marked with
                status <code>TO</code> and no further iterations are performed
              </li>
            </ul>
            <p>Future improvements:</p>
            <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
              <li className="mb-2">
                The above can be extended for a list of possible machine
                configurations (num vCPUs, amount of RAM), and these are stored
                along with the metrics in order to evaluate performance scaling
                w.r.t. computational power
              </li>
            </ul>
          </div>
        </div>
      </ContentSection>
    </PageLayout>
  );
};

export default Methodology;

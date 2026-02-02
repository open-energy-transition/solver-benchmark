import { useScrollSpy } from "@/hooks/useScrollSpy";

const HASH_NAME = "methodology";
const MethodologySection = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 0.7,
  });

  return (
    <div ref={sectionRef}>
      <div className="info-pages-section">
        <div id="methodology" className="h4 info-pages-heading">
          Methodology
        </div>
      </div>

      <div className="info-pages-section">
        <div id="key-decisions" className="h5 info-pages-heading">
          Key Decisions
        </div>
        <p>
          Here are the key details of our benchmarking methodology, along with
          the reasoning behind these decisions:
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
                <strong>parallel</strong>, reducing the total runtime (running
                all benchmarks and solvers as of May 2025 would take 35 days),
                and allowing us to scale to a large number of benchmarks and
                solver versions in the future.
              </li>
              <li className="mb-2">
                It is more <strong>cost-efficient</strong> compared to buying
                and maintaining a physical machine, or to renting a bare metal
                cloud server (which require minimum monthly commitments, and
                usually have a lot more CPUs than are used by most solvers).
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
                  What about <strong>errors</strong> in runtime measurements due
                  to the shared nature of cloud computing?
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
                    coefficient of variation of the runtime of this reference
                    benchmark for each VM. This is a unitless measure which we
                    use to estimate how much noise is present in the runtime
                    measurements from each VM. This{" "}
                    <a href="https://github.com/open-energy-transition/solver-benchmark/issues/393">
                      issue
                    </a>{" "}
                    discusses heuristics that we use to decide when there is too
                    much noise and a benchmark problem needs to be re-run.
                  </li>
                </ul>
              </li>
              <li className="mb-2">
                It reflects the experience of most energy modellers, who use
                cloud compute or shared high performance computing clusters.
                They will most likely not notice a difference of less than 4% in
                performance between 2 solvers, as this variation is present in
                all of their computations.
              </li>
            </ul>
          </li>
          <li className="mb-4">
            <p>
              We use the Python solver interface{" "}
              <a href="https://github.com/PyPSA/linopy">linopy</a> to interface
              with different solvers and the measured runtime is the runtime of
              the call to <code>linopy.Model.solve()</code>. Why?
            </p>
            <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
              <li className="mb-2">
                It reduces the need for us to write a Python interface for each
                solver and version (already 13 as of May 2025, and counting),
                which would largely be a duplicate of the code in
                <code>linopy</code>.
              </li>
              <li className="mb-2">
                Measuring the runtime of linopy is a consistent definition of
                runtime, as the reported runtimes by different solvers may be
                defined differently (e.g., some may include the time taken to
                parse input files or check solver licenses, while others exclude
                it).
              </li>
              <li className="mb-2">
                It also does not require trusting that solvers do not
                (un)intentionally report inaccurate solving runtimes (which we
                mitigate to some extent by comparing reported runtimes to
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
              exceptions: the first is that we set a duality gap tolerance of{" "}
              <code>1e-4</code> for all MILP instances.
            </p>
            <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
              <li className="mb-2">
                This reflects the experience of a modeller who is not an expert
                on solvers and will use them out of the box.
              </li>
              <li className="mb-2">
                We expect solver developers to tune their default options to be
                the most performant configuration of their solver for the
                average problem.
              </li>
              <li className="mb-2">
                Solver developers have told us that they prefer users to use
                default options, because often users do a small benchmark to
                test various options/algorithms and then never update this, and
                end up using outdated options going forward.
              </li>
              <li className="mb-2">
                Depending on feedback and capacity, we can consider having a few
                preset option configurations for solvers as submitted by the
                solver developers if there is strong interest in this. (Please
                join the discussion in this{" "}
                <a href="https://github.com/open-energy-transition/solver-benchmark/issues/TODO">
                  issue
                </a>
                .)
              </li>
            </ul>
          </li>
          <li className="mb-4">
            <p>
              The other exception to the default solver options is that we set a
              fixed random seed.
            </p>
            <ul className="list-disc list-outside ml-6 mt-2 text-base leading-relaxed">
              <li className="mb-2">
                This is in order to ensure our runtimes are reproducible.
              </li>
              <li className="mb-2">
                We do not average over multiple random seeds for now, in order
                to save time and costs (and be slightly greener!). This is
                something we may consider in the future if there is interest and
                budget for it.
              </li>
            </ul>
          </li>
          <li className="mb-2">
            We run benchmarks on linux only. We do not expect a huge difference
            in solver performance on other operating systems, but adding this
            feature could be an interesting direction of future work.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default MethodologySection;

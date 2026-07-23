import FAQItem from "../FAQItem";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useGsapAnimation";

const Contribute = () => {
  const headerRef = useScrollReveal<HTMLDivElement>();
  const itemsRef = useStaggerReveal<HTMLDivElement>(":scope > *");

  return (
    <div
      id="faq"
      className="text-white bg-navy scroll-mt-16 lg:scroll-mt-28"
    >
      <div
        className="
          mx-auto
          max-w-8xl
          px-4
          md:px-12
          pt-16
          pb-16
        "
      >
        <div ref={headerRef} className="">
          <div
            className="
                tag-line-lg
                uppercase
                font-league
                text-white
                mb-4
              "
          >
            Questions
          </div>
          <div className="mb-8 leading-1.4 text-2xl sm:text-[40px] font-lato font-extrabold">
            FAQ
          </div>
        </div>
        <div>
          <div ref={itemsRef} className="mt-4 flex flex-col gap-6">
            {/* TODO allow rich text and links in FAQ answers */}
            <FAQItem
              question="Why are we building a new benchmark platform?"
              answer={
                <span>
                  While there exist well-known benchmark problem sets such as the
                  one by Mittelmann (
                  <a href="https://plato.asu.edu/bench.html">
                    https://plato.asu.edu/bench.html
                  </a>
                  ) or MIPLIB (
                  <a href="https://miplib.zib.de/">https://miplib.zib.de/</a>),
                  we do not yet have a benchmark problem set that focuses on
                  up-to-date and representative problems from the energy planning
                  domain. This is a crucial missing piece that can enable
                  optimization solvers to develop new algorithms and improve their
                  performance on energy models, thereby accelerating key
                  technologies used to plan and implement the energy transition.
                  By building an open-source, transparent, and reproducible
                  platform, we maximize our impact by enabling modellers to
                  submit new benchmark problems and solver developers to
                  reproduce and use our problems for development. Our website
                  offers numerous interactive dashboards that allow users to
                  perform fine-grained analysis depending on their application
                  domain and features of interest.
                </span>
              }
            />
            <FAQItem
              question="How do we select which solvers we benchmark?"
              answer="The aim of this project is to compare and spur development in open source optimization solvers, and to track the gap between open source and proprietary solvers on problems of interest to the energy planning community. Thus, we currently have 5 solvers on the platform: 4 popular open source solvers and a single commercial proprietary solver. We welcome including any open source solver to our platform, and can support community contributions via pull requests. As we do not wish this platform to become a competition between commercial solvers, we restrict the platform to a single proprietary solver, which is Gurobi by direct agreement. Other proprietary solvers exist, and users are welcome to use our benchmarking tools to benchmark their problems on all available solvers."
            />
            <FAQItem
              question="Why do we run the benchmark on publically available cloud virtual machines (VMs)?"
              answer="We chose to run the benchmark on the cloud for several reasons: it is more cost-efficient than physical machines or bare metal cloud servers; it allows parallel runs, which speeds up the process and allows us to scale to many more benchmark problems; it is automatable using infrastructure-as-code; it is transparent and reproducible by anyone with a cloud account; and it reflects the experience of most energy modellers, who use cloud compute or shared high performance computing clusters. We are aware that runtimes vary depending on the other workloads running on the same cloud zones, and have run experiments to estimate the error in runtime. We estimate that all our results have less than 6% error in runtime measurements."
            />
            <FAQItem
              question="What do we mean by modelling framework, scenario, and problem?"
              answer={
                <>
                  <span>We use the following nomenclature on this platform:</span>
                  <ul className="list-disc list-outside ml-6 mt-2">
                    <li className="mb-2">
                      <strong>Modelling framework</strong>, e.g. PyPSA or TIMES,
                      is a software system that allows one to input country or
                      region-specific data and model the energy system of
                      interest.
                    </li>
                    <li className="mb-2">
                      <strong>Scenario</strong> specifies the temporal,
                      spatial, sectoral, and policy scope of the problem, such
                      as geographic scope, available technologies, technology
                      costs, and policy constraints, as well as the temporal
                      and spatial resolution used, e.g. the number of regions
                      or nodes represented and the duration of the time step
                      used in the optimization problem.
                    </li>
                    <li className="mb-2">
                      <strong>Problem</strong> is defined by a combination of a
                      modelling framework and a scenario, captured as an LP or
                      MPS file that is given as input to an optimization
                      solver. Scenarios with the same temporal, spatial,
                      sectoral, and policy scope but different resolutions are
                      available for some modelling frameworks, to allow scaling
                      analysis.
                    </li>
                  </ul>
                  <span>
                    The full collection of problems on our platform represents
                    the benchmark problem set.
                  </span>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;

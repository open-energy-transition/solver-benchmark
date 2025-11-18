import FAQItem from "../FAQItem";

const Contribute = () => {
  return (
    <div
      id="faq"
      className="py-5 text-navy bg-[#F5F4F4] scroll-mt-16 lg:scroll-mt-28"
    >
      <div
        className="
          mx-auto
          max-w-8xl
          px-4
          lg:px-[70px]
          lg:pr-[44px]
          pt-[67px]
          pb-16
        "
      >
        <div className="">
          <div
            className="
                tag-line-lg
                uppercase
                font-league
                text-navy
                mb-4
              "
          >
            Questions
          </div>
          <h3 className="mb-8 leading-1.4">FAQ</h3>
        </div>
        <div>
          <div className="mt-4 flex flex-col gap-6">
            {/* TODO allow rich text and links in FAQ answers */}
            <FAQItem
              question="Why are we building a new benchmark platform?"
              answer={
                <span>
                  While there exist well-known benchmark sets such as the
                  Mittelmann benchmarks (
                  <a href="https://plato.asu.edu/bench.html">
                    https://plato.asu.edu/bench.html
                  </a>
                  ) or MIPLIB (
                  <a href="https://miplib.zib.de/">https://miplib.zib.de/</a>),
                  we do not yet have a benchmark set that focuses on up-to-date
                  and representative problems from the energy planning domain.
                  This is a crucial missing piece that can enable optimization
                  solvers to develop new algorithms and improve their
                  performance on energy models, thereby accelerating key
                  technologies used to plan and implement the energy transition.
                  By building an open-source, transparent, and reproducible
                  platform, we maximize our impact by enabling modellers to
                  submit new benchmark instances and solver developers to
                  reproduce and use our benchmarks for development. Our website
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
              question="Why do we run benchmarks on publically available cloud virtual machines (VMs)?"
              answer="We chose to run benchmarks on the cloud for several reasons: it is more cost-efficient than physical machines or bare metal cloud servers; it allows us to run benchmarks in parallel, which speeds up our run and allows us to scale to many more benchmark instances; it is automatable using infrastructure-as-code; it is transparent and reproducible by anyone with a cloud account; and it reflects the experience of most energy modellers, who use cloud compute or shared high performance computing clusters. We are aware that runtimes vary depending on the other workloads running on the same cloud zones, and have run experiments to estimate the error in runtime. We estimate that 99% of our benchmark instances will have the same ranking of solvers as if run on a bare metal server."
            />
            <FAQItem
              question="What do we mean by benchmark, instance, model, etc?"
              answer="We use the following nomenclature on this platform: An energy modelling framework, e.g. PyPSA or TIMES, is a software system that allows one to input country or region-specific data and model the energy system of interest. An energy model, e.g. eTIMES-EU or TIMES-NZ, is an instantiation of a modelling framework for a particular application or study. A benchmark (problem) is a single model scenario of an energy model, captured as an LP or MPS file that is given as input to an optimization solver. In order to study the scaling behavior of solvers, and to provide solver developers with smaller versions of problems of interest, we group benchmark problems obtained by varying size parameters such as spatial or temporal resolution as being size instances of the same benchmark. The full collection of benchmarks on our platform is the benchmark set."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;

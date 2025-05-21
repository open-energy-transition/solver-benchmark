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
                text-lg/1.1
                uppercase
                font-medium
                tracking-normal
                font-league
                text-dark-grey
                mb-4
              "
          >
            Questions
          </div>
          <div
            className="
                text-[2.5rem]/1.4
                tracking-normal
                font-extrabold
                font-lato
                mb-8
              "
          >
            FAQ
          </div>
        </div>
        <div>
          <div className="mt-4 flex flex-col gap-6">
            {/* TODO allow rich text and links in FAQ answers */}
            <FAQItem
              question="Why did we build a new benchmark platform?"
              answer="While there exist well-known benchmark sets such as the Mittelmann benchmarks (https://plato.asu.edu/bench.html) or MIPLIB (https://miplib.zib.de/), we do not yet have a benchmark set that focuses on up-to-date and representative problems from the energy planning domain. This is a crucial missing piece that can enable optimization solvers to develop new algorithms and improve their performance on energy models, thereby accelerating the energy transition. By building an open-source, transparent, and reproducible platform, we maximize our impact by enabling modellers to submit new benchmark instances and solver developers to reproduce and use our benchmarks for development. Our website offers numerous interactive dashboards that allow users to perform fine-grained analysis depending on their application domain and features of interest."
            />
            <FAQItem
              question="How do we select which solvers we benchmark?"
              answer="The aim of this project is to compare and spur development in open source solvers, and to track the gap between open source and proprietary solvers on problems of interest to the energy planning community. Thus, for our first version, we picked 4 popular open source optimization solvers and a single commercial proprietary solver. We welcome including any open source solver to our platform, and can support community contributions via pull requests. As we do not wish to be a competition between commercial solvers, we restrict the platform to a single proprietary solver, which is Gurobi by direct agreement. Other proprietary solvers exist, and users are welcome to use our benchmarking tools to benchmark their problems on all available solvers."
            />
            <FAQItem
              question="Why do we run benchmarks on publically available cloud virtual machines (VMs)?"
              answer="We chose to run benchmarks on the cloud for several reasons: it is more cost-efficient than physical machines or bare metal cloud servers; it allows us to run benchmarks in parallel which speeds up our run and allows us to scale to many more benchmark instances; it is automatable using infrastructure-as-code; it is transparent and reproducible by anyone with a cloud account; and it reflects the experience of most energy modellers, who use cloud compute or shared high performance computing clusters. We are aware that runtimes vary depending on the other workloads running on the same cloud zones, and have run experiments to estimate the error in runtime. We estimate that 99% of our benchmark instances will have the same ranking of solvers as if run on a bare metal server."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;

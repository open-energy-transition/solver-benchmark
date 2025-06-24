import BenchmarkModelCasesTable from "./tables/BenchmarkModelCasesTable";

const BenchmarkModelCases = () => {
  return (
    <>
      {/* Content */}
      <h4
        id="what-benchmark-problems-do-we-have-and-what-are-missing"
        className="scroll-mt-[9rem]"
      >
        What benchmark problems do we have (and what are missing?)
      </h4>
      <p>
        This section breaks down our current benchmark set according to
        modelling framework, problem type, application domain, and model
        features. This highlights the kinds of energy models that we test
        solvers on, but is also a useful warning of the gaps in our collection.
      </p>
      <BenchmarkModelCasesTable />
      <p>
        * N.A. : the modelling framework does not cover this kind of analysis
      </p>
      <p>
        {" "}
        For version 2 of our platform, we plan to have a public call for
        benchmarks to address the gaps above. In particular, we welcome
        benchmark problem contributions that cover:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          “Application”: DC optimal power flow, Operational and Production cost
          modelling analyses for most modelling frameworks.
        </li>
        <li>
          “Time horizon”: Multi Period analyses; something particularly
          important as problems with multiple time horizons are more challenging
          to solve.
        </li>
        <li>
          “MILP features”: Unit commitment for TIMES and TEMOA (though, indeed,
          they do not focus particularly on power sector modelling); other MILP
          features, such as Piecewise fuel usage, Transmission switching and
          Modularity are missing for most frameworks.
        </li>
        <li>
          “Realistic”: Realistic problems are missing for PowerModels and Sienna
        </li>
        <li>
          Large problem instances are also missing for many model frameworks,
          see the section{" "}
          <a
            className="font-bold"
            href="#what-is-feasible-for-open-source-solvers"
          >
            What is feasible for open solvers
          </a>{" "}
          above.
        </li>
      </ul>
    </>
  );
};

export default BenchmarkModelCases;

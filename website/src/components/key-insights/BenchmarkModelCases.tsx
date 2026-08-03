import Link from "next/link";
import BenchmarkModelCasesTable from "./tables/BenchmarkModelCasesTable";
import { useScrollSpy } from "@/hooks/useScrollSpy";

const HASH = "what-benchmark-problems-do-we-have-and-what-are-missing";

const BenchmarkModelCases = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  return (
    <div ref={sectionRef} className="scroll-mt-[9rem]" id={HASH}>
      {/* Content */}
      <h4>What benchmark problems do we have (and what are missing?)</h4>
      <p>
        This section breaks down our current benchmark problem set according to
        modelling framework, problem type, application domain, and model
        features. This highlights the kinds of energy models that we test
        solvers on, but is also a useful warning of the gaps in our collection.
      </p>
      <BenchmarkModelCasesTable />
    </div>
  );
};

export default BenchmarkModelCases;

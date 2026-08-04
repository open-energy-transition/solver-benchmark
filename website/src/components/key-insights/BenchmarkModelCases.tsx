import { useMemo } from "react";
import { useSelector } from "react-redux";
import BenchmarkModelCasesTable from "./tables/BenchmarkModelCasesTable";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { IResultState } from "@/types/state";

const HASH = "what-benchmark-problems-do-we-have-and-what-are-missing";

const BenchmarkModelCases = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  const fullMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const problemsWithoutFramework = useMemo(
    () =>
      Object.values(fullMetaData).filter((entry) => !entry.modellingFramework)
        .length,
    [fullMetaData],
  );

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
      {problemsWithoutFramework > 0 && (
        <p>
          While the majority of our benchmark problems come from an identified
          modelling framework, {problemsWithoutFramework} problems currently
          have no known modelling framework (e.g. energy-related problems
          sourced from generic benchmark libraries) and are therefore not shown
          in the table below.
        </p>
      )}
      <BenchmarkModelCasesTable />
    </div>
  );
};

export default BenchmarkModelCases;

import { useScrollSpy } from "@/hooks/useScrollSpy";
import BenchmarkModelInsightsTable from "./tables/BenchmarkModelInsightsTable";

const BenchmarkModelInsights = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: "#benchmark-problems-corresponding-to-representative-model-use-cases",
  });

  return (
    <div ref={sectionRef}>
      {/* Content */}
      <h4
        id="benchmark-problems-corresponding-to-representative-model-use-cases"
        className="scroll-mt-[9rem]"
      >
        Benchmark problems corresponding to representative model use-cases
      </h4>
      <p>
        All our technical dashboards can be filtered or focused to the
        application domain or problem type of interest. All our plots and
        results are generated on-the-fly when you select any particular filter
        option. Since this may be overwhelming for some users, we highlight in
        the table below some particular filter combinations that correspond to
        representative problems arising from common use-cases of each modelling
        framework. Click any benchmark problem name to see more details about
        it, and to view its results.
      </p>
      <BenchmarkModelInsightsTable />
    </div>
  );
};

export default BenchmarkModelInsights;

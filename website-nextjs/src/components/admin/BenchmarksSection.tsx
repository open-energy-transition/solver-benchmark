import { useSelector } from "react-redux";

import { CircleIcon, CloseIcon } from "@/assets/icons";
import D3Chart from "../shared/D3PlotChart";
import { IFilterState, IResultState } from "@/types/state";
import { useMemo } from "react";
import { SgmMode } from "@/constants/filter";

const BenchmarksSection = () => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  );
  const sgmMode = useSelector((state: { filters: IFilterState }) => {
    return state.filters.sgmMode;
  });
  const benchmarkResults = useMemo(() => {
    switch (sgmMode) {
      case SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS:
        return benchmarkLatestResults.filter(
          (result) => result.status === "ok",
        );
      default:
        return benchmarkLatestResults;
    }
  }, [sgmMode, benchmarkLatestResults]);

  return (
    <div>
      <div>
        <div className="pt-1.5 pb-3">
          <div className="text-navy font-bold text-xl">Benchmarks</div>

          <p className="flex gap-1 items-center text-dark-grey text-sm">
            <CloseIcon className="size-3" />
            represents benchmarks that timed out, while
            <CircleIcon className="size-3" />
            indicates a successful run.
          </p>
        </div>
      </div>
      <D3Chart chartData={benchmarkResults} />
    </div>
  );
};

export default BenchmarksSection;

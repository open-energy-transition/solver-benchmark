import { useSelector } from "react-redux";

import { CircleIcon, CloseIcon } from "@/assets/icons";
import D3Chart from "../shared/D3PlotChart";
import { IFilterState, IResultState } from "@/types/state";
import { useMemo } from "react";
import { SgmMode } from "@/constants/filter";

interface BenchmarksSectionProps {
  timeout: number;
}

const BenchmarksSection = ({ timeout }: BenchmarksSectionProps) => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => result.timeout === timeout);

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
      <div className="px-5">
        <div className="pt-1.5 pb-3">
          <div className="text-navy font-bold text-xl 4xl:text-2xl">
            Runtime vs Memory
          </div>

          <p className="flex gap-1 items-center text-dark-grey text-sm 4xl:text-xl">
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

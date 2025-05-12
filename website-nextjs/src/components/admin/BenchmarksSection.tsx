import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { CircleIcon, CloseIcon } from "@/assets/icons";
import D3Chart from "../shared/D3PlotChart";
import { IFilterState, IResultState } from "@/types/state";
import { useMemo } from "react";
import { SgmMode } from "@/constants/filter";
import { PATH_DASHBOARD } from "@/constants/path";

interface BenchmarksSectionProps {
  timeout: number;
}

const BenchmarksSection = ({ timeout }: BenchmarksSectionProps) => {
  const router = useRouter();

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

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

  const chartData = benchmarkResults.map((result) => {
    const metaData = rawMetaData[result.benchmark];

    return {
      ...result,
      problemSize: metaData?.sizes.find((size) => size.name === result.size)
        ?.size,
    };
  });

  return (
    <div>
      <div className="px-5">
        <div className="pt-1.5 pb-3">
          <div className="text-navy font-bold text-xl">Runtime vs Memory</div>

          <p className="flex flex-wrap gap-1 items-center text-dark-grey text-sm 4xl:text-xl">
            A graph showing all the benchmark results (potentially filtered)
            that are summarized by the table above. Every data point in this
            graph is the result of running one solver on one benchmark problem
            instance. The more (circular) data points you see for a particular
            solver, the more benchmark instances it was able to solve
            successfully. A point that is lower than another one uses less
            memory, and a point that is to the left of another means it ran
            faster.
          </p>
          <p className="flex flex-wrap gap-1 items-center text-dark-grey text-sm 4xl:text-xl">
            <span>
              Click on any point in this graph to see details of the benchmark
              instance.
            </span>
            <span className="flex items-center gap-1">
              <CloseIcon className="size-3" />
              <span>
                represents benchmark instances that timed out or errored,
              </span>
            </span>
            <span className="flex items-center gap-1">
              <CircleIcon className="size-3" />
              <span>indicates a successful run.</span>
            </span>
          </p>
        </div>
      </div>
      <D3Chart
        chartData={chartData}
        onPointClick={(result) => {
          router.push(
            PATH_DASHBOARD.benchmarkDetail.one.replace(
              "{name}",
              result.benchmark,
            ),
          );
        }}
      />
    </div>
  );
};

export default BenchmarksSection;

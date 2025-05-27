import { useMemo } from "react";
import { useSelector } from "react-redux";

import { CircleIcon, CloseIcon } from "@/assets/icons";
import D3Chart from "@/components/shared/D3PlotChart";
import { IResultState } from "@/types/state";

const BenchmarksSection = ({ benchmarkName }: { benchmarkName: string }) => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults;
  });

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const chartData = useMemo(
    () =>
      benchmarkResults
        .filter((result) => result.benchmark === benchmarkName)
        .map((result) => {
          const metaData = rawMetaData[result.benchmark];
          return {
            ...result,
            problemSize: metaData?.sizes.find(
              (size) => size.name === result.size,
            )?.size,
          };
        }),
    [benchmarkResults],
  );

  return (
    <div className="py-4">
      <div className="text-navy px-5 text-l block items-center mt-2">
        This plot shows the runtime and memory consumption of the latest version
        (available on our platform) of each solver on the size instances of this
        benchmark.
      </div>
      <D3Chart chartData={chartData} />
      <div className="pt-1.5 pb-3 pl-3">
        <p className="flex gap-1 items-center text-dark-grey text-sm">
          <CloseIcon className="size-3" />
          represents benchmarks that timed out, while
          <CircleIcon className="size-3" />
          indicates a successful run.
        </p>
      </div>
    </div>
  );
};

export default BenchmarksSection;

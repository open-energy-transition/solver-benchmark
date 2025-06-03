import { useMemo } from "react";
import { useSelector } from "react-redux";

import { CircleIcon, CloseIcon, QuestionLineIcon } from "@/assets/icons";
import D3PlotChart from "@/components/shared/D3PlotChart";
import { IResultState } from "@/types/state";
import Popup from "reactjs-popup";
import { SgmExplanation } from "@/components/shared";

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
        <span>
          This plot shows the runtime and memory consumption of the latest
          version
        </span>
        <span className="inline-flex gap-2">
          <Popup
            on={["hover"]}
            trigger={() => (
              <span className="flex items-baseline">
                <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />)
              </span>
            )}
            position="right center"
            closeOnDocumentClick
            arrow={false}
          >
            <div className="bg-white border-stroke border px-4 py-2 m-4 rounded-lg break-words">
              <SgmExplanation />
            </div>
          </Popup>
        </span>
        <span>
          (available on our platform) of each solver on the size instances of
          this benchmark.
        </span>
      </div>
      <D3PlotChart startFrom={0} chartData={chartData} domainPadding={100} />
      <div className="pt-1.5 pb-3 pl-3">
        <p className="flex gap-1 items-center text-dark-grey text-sm">
          <CloseIcon className="size-3" />
          represents benchmarks where the solver failed to solve within the time
          limit, while
          <CircleIcon className="size-3" />
          indicates a successful run.
        </p>
      </div>
    </div>
  );
};

export default BenchmarksSection;

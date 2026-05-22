import { useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import ChartResultsSections from "./ChartResultsSections";
import ChartResultsSectionsVarians from "./ChartResultsSectionsVarians";
import { IResultState } from "@/types/state";
import { ArrowUpIcon } from "@/assets/icons";
import { PATH_DASHBOARD, ROOT_PATH } from "@/constants/path";

const LATERAL_LABEL_CLASS = "text-lg font-bold";

// Stable constant — avoids recreating the array on every render
const LP_SIZE_ANNOTATIONS = [
  "Less than 1M variables",
  "More than 1M variables",
];

const GetStartedChart = () => {
  const benchmarkLatestResultsRaw = useSelector(
    (state: { results: IResultState }) => state.results.benchmarkLatestResults,
  );

  return (
    <div className="bg-[#F4F6FA] text-navy w-full mx-auto max-w-8xl py-4 px-6 md:px-12">
      {/* Column headers */}
      <div className="flex">
        <div className="w-10 shrink-0" />
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className={`text-center ${LATERAL_LABEL_CLASS}`}>
            Linear programming problems
          </div>
          <div className={`text-center ${LATERAL_LABEL_CLASS}`}>
            Mixed-integer linear programming problems
          </div>
        </div>
      </div>

      {/* Top row: slowdown panels */}
      <div className="flex items-stretch gap-0 mt-1">
        <div className="w-10 shrink-0 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={LATERAL_LABEL_CLASS}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Slowdown relative to the fastest solver
            </span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <ChartResultsSections
            hideLegend
            showBarTopLabels
            sizeAnnotations={LP_SIZE_ANNOTATIONS}
          />
          <ChartResultsSections problemClass="MILP" hideLegend />
        </div>
      </div>

      {/* Bottom row: solved% panels */}
      <div className="flex items-stretch gap-0">
        <div className="w-10 shrink-0 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={LATERAL_LABEL_CLASS}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Problems solved within time and memory limits (%)
            </span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <ChartResultsSectionsVarians hideLegend />
          <ChartResultsSectionsVarians problemClass="MILP" hideLegend />
        </div>
      </div>

      {/* Buttons below the figure */}
      <div className="mt-10 flex flex-wrap items-center justify-start pb-8 gap-4 md:gap-6 text-center">
        <Link
          href={ROOT_PATH.keyInsights}
          className="
            bg-white
            cursor-pointer
            duration-200
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            font-bold
            md:text-xl
            px-8
            py-4
            rounded-2xl
            shadow-sm
            text-lg
            text-teal
            transition-all
            border border-teal
          "
        >
          KEY INSIGHTS
        </Link>
        <Link
          href={PATH_DASHBOARD.home}
          className="
            bg-teal
            flex
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            font-bold
            items-center
            md:text-xl
            px-8
            py-4
            rounded-2xl
            shadow-sm
            text-lg
            text-white
          "
        >
          <span>DETAILED RESULTS</span>
          <ArrowUpIcon className="ml-3 text-white rotate-90 size-6" />
        </Link>
      </div>
    </div>
  );
};

export default GetStartedChart;

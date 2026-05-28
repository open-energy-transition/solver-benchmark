import { useMemo } from "react"
import { useSelector } from "react-redux"
import Link from "next/link"
import ChartResultsSections from "./ChartResultsSections"
import ChartResultsSectionsVarians from "./ChartResultsSectionsVarians"
import { IResultState } from "@/types/state"
import { ArrowUpIcon } from "@/assets/icons"
import { PATH_DASHBOARD, ROOT_PATH } from "@/constants/path"

const LATERAL_LABEL_CLASS = "text-2xl font-bold"

// Stable constant — avoids recreating the array on every render
const LP_SIZE_ANNOTATIONS = ["Less than 1M variables", "More than 1M variables"]

const MILP_NOTE = (
  <p className="text-[11px] leading-snug text-navy">
    We only have two problems in this category, and we are looking for more.
    Please submit your problems following these{" "}
    <Link
      href="/blog/open_call"
      className="underline font-medium text-teal hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
    >
      guidelines
    </Link>
    .
  </p>
)

const GetStartedChart = () => {
  const benchmarkLatestResultsRaw = useSelector(
    (state: { results: IResultState }) => state.results.benchmarkLatestResults,
  )

  return (
    <div className="bg-[#F4F6FA] text-navy w-full mx-auto max-w-8xl py-4 px-6 md:px-12">

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col gap-6 md:hidden">
        {/* LP section */}
        <div>
          <p className={`text-center mb-1 ${LATERAL_LABEL_CLASS}`}>
            Linear programming problems
          </p>
          <p className="text-center text-sm font-semibold text-navy/70 mb-3">
            Slowdown relative to the fastest solver
          </p>
          <ChartResultsSections
            hideLegend
            showBarTopLabels
            sizeAnnotations={LP_SIZE_ANNOTATIONS}
          />
          <p className="text-center text-sm font-semibold text-navy/70 mt-6 mb-3">
            Problems solved within time and memory limits (%)
          </p>
          <ChartResultsSectionsVarians hideLegend />
        </div>

        {/* MILP section */}
        <div>
          <p className={`text-center mb-1 ${LATERAL_LABEL_CLASS}`}>
            Mixed-integer linear programming problems
          </p>
          <p className="text-center text-sm font-semibold text-navy/70 mb-3">
            Slowdown relative to the fastest solver
          </p>
          <ChartResultsSections problemClass="MILP" hideLegend rightmostGroupNote={MILP_NOTE} rightmostGroupOpacity={0.4} />
          <p className="text-center text-sm font-semibold text-navy/70 mt-6 mb-3">
            Problems solved within time and memory limits (%)
          </p>
          <ChartResultsSectionsVarians problemClass="MILP" hideLegend />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block">
        {/* Top row: slowdown panels */}
        <div className="text-center gap-0 mt-1">
          <div className="shrink-0 relative">
            <div className="">
              <span
                className={LATERAL_LABEL_CLASS}
              >
                Slowdown relative to the fastest solver
              </span>
            </div>
          </div>
          <div className="flex-1 grid md:grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartResultsSections
              hideLegend
              showBarTopLabels
              sizeAnnotations={LP_SIZE_ANNOTATIONS}
            />
            <div className={`xl:hidden text-center ${LATERAL_LABEL_CLASS}`}>
              Linear programming problems
            </div>
            <ChartResultsSections problemClass="MILP" hideLegend rightmostGroupNote={MILP_NOTE} rightmostGroupOpacity={0.4} />
          </div>
        </div>
        {/* Bottom row: solved% panels */}
        <div className="">
            <div className="text-center">
              <span
                className={LATERAL_LABEL_CLASS}
              >
                Problems solved within time and memory limits (%)
              </span>
            </div>
          <div className="flex-1 grid md:grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartResultsSectionsVarians hideLegend />
            <ChartResultsSectionsVarians problemClass="MILP" hideLegend />
          </div>
        
        </div>
      </div>

      {/* Buttons below the figure */}
      <div className="mt-10 flex flex-wrap items-center justify-center md:justify-start pb-8 gap-4 md:gap-6 text-center">
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
            w-full md:w-auto
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
            justify-center
            md:text-xl
            px-8
            py-4
            rounded-2xl
            shadow-sm
            text-lg
            text-white
            w-full md:w-auto
          "
        >
          <span>DETAILED RESULTS</span>
          <ArrowUpIcon className="ml-3 text-white rotate-90 size-6" />
        </Link>
      </div>
    </div>
  )
}

export default GetStartedChart

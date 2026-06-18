import Link from "next/link";
import ChartResultsSections from "./ChartResultsSections";
import ChartResultsSectionsVarians from "./ChartResultsSectionsVarians";
import { ArrowUpIcon } from "@/assets/icons";
import { PATH_DASHBOARD, ROOT_PATH } from "@/constants/path";

const NOTE_BOX = (
  <div className="px-6 py-5 text-navy font-lato border border-[#CAD9EF] bg-white rounded-2xl w-full text-left">
    <p className="text-sm leading-relaxed">
      <b>Note:</b> The benchmark is not intended to identify a single
      &ldquo;best&rdquo; solver or provide a universal ranking. Solver
      performance depends on the characteristics of the optimization problem,
      modeling framework, solver configuration, and user requirements. Instead,
      the benchmark is intended as an educational and diagnostic resource. The
      results provide indicative insights into solver performance and
      feasibility across a diverse set of energy system models. If you want to
      pick a solver for your particular application, we recommend using{" "}
      <Link
        href="https://github.com/open-energy-transition/solver-benchmark/?tab=readme-ov-file#running-benchmarks"
        className="font-bold underline underline-offset-2 hover:opacity-75"
        target="_blank"
        rel="noopener noreferrer"
      >
        our scripts
      </Link>{" "}
      to benchmark on your own problems. See the{" "}
      <Link
        href="/dashboard/main-results#caveats"
        className="font-bold underline underline-offset-2 hover:opacity-75"
      >
        Caveats
      </Link>{" "}
      and full{" "}
      <Link
        href="/methodology"
        className="font-bold underline underline-offset-2 hover:opacity-75"
      >
        Methodology
      </Link>{" "}
      for more information.
    </p>
  </div>
);

const LATERAL_LABEL_CLASS = "text-[22px] lg:text-2xl font-bold";

// Stable constant — avoids recreating the array on every render
const LP_SIZE_ANNOTATIONS = [
  "Less than 1M variables",
  "More than 1M variables",
];

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
);

const GetStartedChart = () => {
  return (
    <div className="bg-[#F4F6FA] text-navy w-full mx-auto max-w-8xl py-4 px-6 md:px-12">
      {/* ── DESKTOP LAYOUT ── */}
      <div className=" md:block">
        {/* Top row: slowdown panels */}
        <div className="text-center gap-0 mt-1">
          <div className="shrink-0 relative">
            <div className="">
              <span className={LATERAL_LABEL_CLASS}>
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
            <ChartResultsSections
              problemClass="MILP"
              hideLegend
              rightmostGroupNote={MILP_NOTE}
              rightmostGroupOpacity={0.4}
              sizeAnnotations={LP_SIZE_ANNOTATIONS}
            />
          </div>
        </div>
        {/* Bottom row: solved% panels */}
        <div className="mt-6">
          <div className="text-center">
            <span className={LATERAL_LABEL_CLASS}>
              Problems solved within time and memory limits (%)
            </span>
          </div>
          <div className="flex-1 grid md:grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartResultsSectionsVarians
              hideLegend
              sizeAnnotations={LP_SIZE_ANNOTATIONS}
            />
            <ChartResultsSectionsVarians
              problemClass="MILP"
              hideLegend
              sizeAnnotations={LP_SIZE_ANNOTATIONS}
              rightmostGroupOpacity={0.4}
            />
          </div>
        </div>
      </div>

      {/* Note below the figure, full width */}
      <div className="mt-8 mb-4">{NOTE_BOX}</div>

      {/* Buttons below the figure */}
      <div className="flex flex-wrap items-center justify-center md:justify-start pb-8 gap-4 md:gap-6 text-center">
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
  );
};

export default GetStartedChart;

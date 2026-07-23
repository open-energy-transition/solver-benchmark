import { useSelector } from "react-redux";
import { useMemo } from "react";
import { IResultState } from "@/types/state";
import StatsBox from "@/components/common/StatsBox";
import { HIPO_SOLVERS } from "@/utils/solvers";
import {
  useStaggerReveal,
  useEntranceAnimation,
} from "@/hooks/useGsapAnimation";

const GetStarted = () => {
  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const modellingFrameworks = useMemo(
    () =>
      Array.from(
        new Set(
          Object.keys(rawMetaData).map((key) => {
            return rawMetaData[key].modellingFramework;
          }),
        ),
      ),
    [rawMetaData],
  );

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const availableProblems = useSelector((state: { results: IResultState }) => {
    return state.results.availableProblems;
  });

  const sectionRef = useStaggerReveal<HTMLDivElement>(":scope .md\\:flex > *", {
    fromDirection: "bottom",
    y: 40,
    stagger: 0.15,
  });

  const headingRef = useEntranceAnimation<HTMLDivElement>({
    y: 30,
    duration: 1,
    delay: 0.1,
  });

  return (
    <div
      ref={sectionRef}
      id="benchmarks"
      className="text-soft-gray bg-navy scroll-mt-16 lg:scroll-mt-28"
    >
      <div
        className="
          xl:flex
          mx-auto
          max-w-8xl
          px-6
          md:px-12
          pt-16
          pb-16
          justify-between
        "
      >
        <div className="w-full xl:w-1/4">
          <div
            className="
              tag-line-lg
              uppercase
              font-league
              mb-4
            "
          >
            PROBLEMS
          </div>
          <div
            ref={headingRef}
            className="leading-1.4 mb-2 text-2xl sm:text-[40px] font-lato font-extrabold tracking-normal text-soft-gray"
          >
            WHAT DO WE HAVE?
          </div>
        </div>
        <div className="w-full xl:w-[67.42%]">
          <div
            className="
              tag-line-lg
              leading-1.4
              font-medium
              max-w-4xl
              mb-2.5
              xl:pl-4.5
            "
          >
            Our platform consists of open, community-contributed benchmark
            problems from various energy modelling frameworks. Our open-source
            benchmarking infrastructure runs them on multiple versions of
            leading solvers on multiple hardware configurations, to gather
            insights on how performance varies with problem size, computational
            resources, and solver evolution.
          </div>
          <div className="md:flex justify-between">
            <StatsBox
              value={modellingFrameworks.length}
              label="Modelling Frameworks"
            />
            <StatsBox value={availableProblems.length} label="Problems" />
            <StatsBox
              value={availableSolvers.length - HIPO_SOLVERS.length}
              label="Solvers"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;

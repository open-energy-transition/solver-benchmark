import { useSelector } from "react-redux";
import { useMemo } from "react";
import { IResultState } from "@/types/state";
import StatsBox from "@/components/common/StatsBox";

const GetStarted = () => {
  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const modelNames = useMemo(
    () =>
      Array.from(
        new Set(
          Object.keys(rawMetaData).map((key) => {
            return rawMetaData[key].modelName;
          }),
        ),
      ),
    [rawMetaData],
  );

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const availableBenchmarksAndSizes = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableBenchmarksAndSizes;
    },
  );

  return (
    <div
      id="benchmarks"
      className="text-navy bg-[#F5F4F4] scroll-mt-16 lg:scroll-mt-28"
    >
      <div
        className="
          xl:flex
          mx-auto
          max-w-8xl
          px-4
          lg:px-[70px]
          lg:pr-[44px]
          pt-[67px]
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
            BENCHMARKS
          </div>
          <h3 className="leading-1.4 mb-2">WHAT DO WE HAVE?</h3>
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
            Our platform consists of open-source, community-contributed
            benchmarks from leading open energy modelling systems. Our open
            benchmarking infrastructure runs them on multiple versions of
            leading solvers on multiple hardware configurations, to gather
            insights on how performance varies with benchmark size,
            computational resources, and solver evolution.
          </div>
          <div className="md:flex justify-between">
            <StatsBox value={modelNames.length} label="Model Frameworks" />
            <StatsBox
              value={availableBenchmarksAndSizes.length}
              label="Benchmarks"
            />
            <StatsBox value={availableSolvers.length} label="Solvers" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;

import { useSelector } from "react-redux";
// internal
import {
  AppIcon,
  DatabaseIcon,
  GraphBarIcon,
  HistoryIcon,
  LayoutGroupIcon,
  VectorSquareIcon,
} from "@/assets/icons";
import { useMemo } from "react";
import { IResultState } from "@/types/state";

const DetailSection = () => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults;
  });

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const availableBenchmarksCount = Object.keys(rawMetaData).length;

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const avaliableVersion = useMemo(
    () =>
      Array.from(
        new Set(benchmarkResults.map((result) => result.solverVersion)),
      ),
    [benchmarkResults],
  );

  const avaliableInstance = useMemo(
    () =>
      Array.from(
        new Set(
          benchmarkResults.map(
            (result) => `${result.benchmark}-${result.size}`,
          ),
        ),
      ),
    [benchmarkResults],
  );

  const detailData = [
    {
      label: "Benchmarks",
      value: availableBenchmarksCount,
      icon: <GraphBarIcon />,
      generateLabel: () => (
        <>
          Benchmarks:{" "}
          <span className="font-bold">
            {availableBenchmarksCount} {`(${avaliableInstance.length}`}{" "}
            instances
            {")"}
          </span>
        </>
      ),
    },
    {
      label: "Solvers",
      value: availableSolvers.length,
      icon: <VectorSquareIcon />,
      generateLabel: () => (
        <>
          Solvers:{" "}
          <span className="font-bold">
            {availableSolvers.length} {`(${avaliableVersion.length}`} versions
            {")"}
          </span>
        </>
      ),
    },
    {
      label: "Iterations",
      value: "1",
      icon: <LayoutGroupIcon />,
    },
    {
      label: "vCPUs",
      value: "2 (1 core)",
      icon: <AppIcon />,
    },
    {
      label: "Memory",
      value: "16 GB",
      icon: <DatabaseIcon />,
    },
    {
      label: "Timeout",
      // TODO: Replace hardcoded "10 min" timeout
      value: "10 min",
      icon: <HistoryIcon />,
    },
  ];

  return (
    <div className="bg-white rounded-xl py-4 px-4 md:px-12">
      <ul className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-2 text-dark-grey">
        {detailData.map((data, idx) => (
          <li key={idx} className="text-sm md:text-base flex items-center">
            <span className="w-6 md:w-auto">{data.icon}</span>
            {data.generateLabel ? (
              <div className="ml-1">{data.generateLabel()}</div>
            ) : (
              <div className="ml-1">
                <span className="ml-1">
                  {data.label}
                  {":"}
                </span>
                <span className="font-bold ml-1">{data.value}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default DetailSection;

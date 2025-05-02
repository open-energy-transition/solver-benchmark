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

interface DetailSectionProps {
  useMetadataCount?: boolean;
}

const DetailSection = ({ useMetadataCount = false }: DetailSectionProps) => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults;
  });

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const fullMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const availableBenchmarksCount = useMemo(() => {
    if (useMetadataCount) {
      return Object.keys(fullMetaData).length;
    }
    return Array.from(
      new Set(benchmarkResults.map((result) => result.benchmark)),
    ).length;
  }, [rawMetaData, fullMetaData, benchmarkResults, useMetadataCount]);

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

  const avaliableInstance = useMemo(() => {
    if (useMetadataCount) {
      return Object.keys(fullMetaData).reduce((acc, key) => {
        return acc + (fullMetaData[key]?.sizes?.length || 0);
      }, 0);
    } else {
      return Array.from(
        new Set(
          benchmarkResults.map(
            (result) => `${result.benchmark}-${result.size}`,
          ),
        ),
      ).length;
    }
  }, [benchmarkResults]);

  const detailData = [
    {
      label: "Benchmarks",
      value: availableBenchmarksCount,
      icon: <GraphBarIcon />,
      generateLabel: () => (
        <>
          Benchmarks:{" "}
          <span className="font-bold">
            {availableBenchmarksCount} {`(${avaliableInstance}`} instances
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
            {availableSolvers.length}
            <span className="hidden xl:inline">
              {`(${avaliableVersion.length}`} versions
              {")"}
            </span>
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
    <div className="bg-white rounded-xl py-4 px-4 xl:px-8 2xl:px-4 4xl:px-4">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 2xl:gap-4 text-dark-grey">
        {detailData.map((data, idx) => (
          <li
            key={idx}
            className="text-sm xl:text-base 2xl:text-lg 4xl:text-xl flex items-center"
          >
            <span className="w-6 xl:w-auto 4xl:w-8">{data.icon}</span>
            {data.generateLabel ? (
              <div className="ml-1 2xl:ml-2 4xl:ml-3">
                {data.generateLabel()}
              </div>
            ) : (
              <div className="ml-1 2xl:ml-2 4xl:ml-3">
                <span className="ml-1 2xl:ml-2 4xl:ml-3">
                  {data.label}
                  {":"}
                </span>
                <span className="font-bold ml-1 2xl:ml-2 4xl:ml-3">
                  {data.value}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default DetailSection;

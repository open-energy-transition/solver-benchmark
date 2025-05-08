import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";

import { IResultState } from "@/types/state";
import { formatSolverWithVersion } from "@/utils/solvers";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";

const BASE_STORAGE_URL = "https://storage.googleapis.com/solver-benchmarks";

const LogsAndSolutionsSection = ({
  benchmarkDetail,
  benchmarkName,
}: {
  benchmarkDetail: MetaDataEntry;
  benchmarkName: string;
}) => {
  const solversData = useSelector((state: { results: IResultState }) => {
    return state.results.solversData;
  });

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults;
  });

  const [selectedSolver, setselectedSolver] = useState("");
  const [selectedInstances, setSelectedInstances] = useState<string>(
    benchmarkDetail.sizes.length > 0 ? benchmarkDetail.sizes[0].name : "",
  );

  const urlPathSegment = useMemo(() => {
    if (!selectedSolver || !selectedInstances) return "";

    const [solver, version] = selectedSolver.split("--");
    const runId =
      benchmarkResults.find(
        (result) =>
          result.solver === solver &&
          result.solverVersion === version &&
          result.size === selectedInstances &&
          result.benchmark === benchmarkName,
      )?.runId || "";

    if (!runId) return "";
    return `${runId}/${benchmarkName}-${selectedInstances}-${solver}-${version}`;
  }, [benchmarkName, selectedInstances, selectedSolver]);

  const getLogDownloadUrl = () => {
    if (!urlPathSegment) return "";
    return `${BASE_STORAGE_URL}/logs/${urlPathSegment}.log.gz`;
  };

  const getSolutionDownloadUrl = () => {
    if (!urlPathSegment) return "";
    return `${BASE_STORAGE_URL}/solutions/${urlPathSegment}.sol.gz`;
  };

  const solverOptions = solversData.flatMap((s) =>
    s.versions.map((version) => `${s.solver}--${version}`),
  );
  useEffect(() => {
    setselectedSolver(
      `${solversData[0].solver}--${solversData[0].versions[0]}`,
    );
  }, [solversData]);

  return (
    <div className="py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-back text-2xl font-medium mb-7 mt-2 font-league pl-1.5">
          Logs and solutions
        </div>
        <div className="flex gap-2 justify-end items-center">
          <Link
            href={getLogDownloadUrl()}
            className={`text-white bg-green-pop px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex gap-1 items-center justify-center w-full sm:w-auto text-sm sm:text-base 4xl:text-lg ${
              !urlPathSegment
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }`}
          >
            Download log
          </Link>
          <Link
            href={getSolutionDownloadUrl()}
            className={`text-white bg-navy px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex gap-1 items-center justify-center w-full sm:w-auto text-sm sm:text-base 4xl:text-lg ${
              !urlPathSegment
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }`}
          >
            Download solution
          </Link>
        </div>
      </div>
      <div className="flex">
        <div className="w-full sm:w-1/2 bg-[#F0F4F2] rounded-lg sm:rounded-l-lg sm:rounded-r-none">
          <div className="p-2 sm:p-3 pl-3.5 font-bold font-lato text-base sm:text-lg 4xl:xl">
            Solver
          </div>
          <select
            className="w-full font-bold pl-3 bg-[#F0F4F2] px-4 sm:px-6 py-3 sm:py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-sm sm:text-base rounded-b-lg block focus-visible:outline-none 4xl:text-lg"
            name="solver"
            onChange={(event) => setselectedSolver(event.target.value)}
            value={selectedSolver}
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {formatSolverWithVersion(solver)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-1/2 bg-[#E1E5F2] rounded-lg sm:rounded-r-lg sm:rounded-l-none">
          <div className="p-2 sm:p-3 pl-3.5 font-bold font-lato text-base sm:text-lg 4xl:xl">
            Instances
          </div>
          <select
            className="w-full pl-3 font-bold bg-[#E1E5F2] px-4 sm:px-6 py-3 sm:py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-sm sm:text-base rounded-b-lg block focus-visible:outline-none 4xl:text-lg"
            name="instance"
            onChange={(event) => setSelectedInstances(event.target.value)}
            value={selectedInstances}
          >
            <option disabled>Instances</option>
            {benchmarkDetail.sizes.map((benchmarkSize, idx) => (
              <option key={idx} value={benchmarkSize.name}>
                {benchmarkSize.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LogsAndSolutionsSection;

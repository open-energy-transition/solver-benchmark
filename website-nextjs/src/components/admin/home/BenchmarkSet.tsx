import { useSelector } from "react-redux";
// local
import { ArrowWhiteIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IResultState } from "@/types/state";
import BenchmarkStatisticsCharts from "@/components/admin/benchmarks/BenchmarkStatisticsCharts";

const BenchmarkSet = () => {
  const fullMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const problemSizeResult: { [key: string]: string } = {};
  Object.keys(fullMetaData).forEach((metaDataKey) => {
    fullMetaData[metaDataKey]?.sizes?.forEach((s) => {
      problemSizeResult[`${metaDataKey}'-'${s.name}`] = s.size;
    });
  });

  const uniqueValues = {
    sectoralFocus: new Set<string>(),
    sectors: new Set<string>(),
    problemClasses: new Set<string>(),
    applications: new Set<string>(),
    models: new Set<string>(),
    modellingFrameworks: new Set<string>(),
  };

  Object.keys(fullMetaData).forEach((key) => {
    const {
      sectoralFocus,
      sectors,
      problemClass,
      application,
      modellingFramework,
    } = fullMetaData[key];
    if (sectoralFocus) {
      uniqueValues.sectoralFocus.add(sectoralFocus);
    }
    if (sectors) {
      sectors.split(",").forEach((sector) => {
        uniqueValues.sectors.add(sector.trim());
      });
    }
    if (problemClass) {
      uniqueValues.problemClasses.add(problemClass);
    }
    if (application) {
      uniqueValues.applications.add(application);
    }
    if (modellingFramework) {
      uniqueValues.modellingFrameworks.add(modellingFramework);
    }
  });

  const availableSectoralFocus = Array.from(uniqueValues.sectoralFocus);
  const availableSectors = Array.from(uniqueValues.sectors);
  const availableProblemClasses = Array.from(uniqueValues.problemClasses);
  const availableApplications = Array.from(uniqueValues.applications);
  const availableModellingFrameworks = Array.from(
    uniqueValues.modellingFrameworks,
  );
  const availableProblemSizes = Array.from(
    new Set(
      Object.keys(problemSizeResult).map((key) => problemSizeResult[key]),
    ),
  ).filter((size) => size !== undefined && size !== null);

  return (
    <div className="pl-1 pb-1 pr-3 bg-[#F4F6FA] rounded-xl">
      <div className="lg:flex items-center justify-between gap-2 py-4 px-2 md:px-0 md:ml-5 md:mr-7">
        <div className="text-navy">
          <h5>Benchmark Set</h5>
        </div>
        <div className="grid sm:flex justify-between items-center gap-2">
          <Link
            className="tag-line-xs w-max text-[#50634e] border border-green-pop bg-white px-3 py-2 rounded-lg flex gap-1 items-center cursor-pointer hover:bg-green-pop hover:text-white transition-colors"
            href={PATH_DASHBOARD.benchmarkSet.list}
          >
            Benchmark Set
          </Link>
          <Link
            className="tag-line-xs w-max text-white bg-green-pop px-3 py-2 rounded-lg flex gap-1 items-center cursor-pointer"
            href={PATH_DASHBOARD.featureDistribution}
          >
            More details
            <ArrowWhiteIcon
              fill="none"
              className="size-4 text-white stroke-white"
            />
          </Link>
        </div>
      </div>
      <BenchmarkStatisticsCharts
        availableSectoralFocus={availableSectoralFocus}
        availableSectors={availableSectors}
        availableProblemClasses={availableProblemClasses}
        availableApplications={availableApplications}
        availableModellingFrameworks={availableModellingFrameworks}
        availableProblemSizes={availableProblemSizes}
      />
    </div>
  );
};

export default BenchmarkSet;

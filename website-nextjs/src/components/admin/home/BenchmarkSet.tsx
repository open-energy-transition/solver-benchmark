import { useSelector } from "react-redux";
// local
import { ArrowWhiteIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IFilterState, IResultState, RealisticOption } from "@/types/state";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import BenchmarkStatisticsCharts from "@/components/admin/benchmarks/BenchmarkStatisticsCharts";

const BenchmarkSet = () => {
  const router = useRouter();

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
      modelName,
      modellingFramework,
    } = fullMetaData[key];
    uniqueValues.sectoralFocus.add(sectoralFocus);
    sectors.split(",").forEach((sector) => {
      uniqueValues.sectors.add(sector.trim());
    });
    uniqueValues.problemClasses.add(problemClass);
    uniqueValues.applications.add(application);
    uniqueValues.models.add(modelName);
    uniqueValues.modellingFrameworks.add(modellingFramework);
  });

  const availableSectoralFocus = Array.from(uniqueValues.sectoralFocus);
  const availableSectors = Array.from(uniqueValues.sectors);
  const availableProblemClasses = Array.from(uniqueValues.problemClasses);
  const availableApplications = Array.from(uniqueValues.applications);
  const availableModels = Array.from(uniqueValues.models);
  const availableModellingFrameworks = Array.from(
    uniqueValues.modellingFrameworks,
  );
  const availableProblemSizes = Array.from(
    new Set(
      Object.keys(problemSizeResult).map((key) => problemSizeResult[key]),
    ),
  );

  const encodeValue = (value: string) => {
    return encodeURIComponent(value);
  };

  const decodeValue = (value: string) => {
    return decodeURIComponent(value);
  };

  const parseUrlParams = () => {
    const filters: Partial<IFilterState> = {};

    [
      "sectoralFocus",
      "sectors",
      "problemClass",
      "application",
      "modelName",
      "problemSize",
      "realistic",
    ].forEach((key) => {
      const value = router.query[key];
      if (typeof value === "string") {
        // @ts-expect-error Type inference issues with dynamic keys
        filters[key as keyof IFilterState] = value
          ? value.split(";").map(decodeValue)
          : [];
      }
    });

    return filters;
  };

  const [isInit, setIsInit] = useState(false);
  const [localFilters, setLocalFilters] = useState<IFilterBenchmarkDetails>({
    sectoralFocus: availableSectoralFocus,
    sectors: availableSectors,
    problemClass: availableProblemClasses,
    application: availableApplications,
    modelName: availableModels,
    problemSize: availableProblemSizes,
    realistic: [RealisticOption.Realistic, RealisticOption.Other],
  });

  useEffect(() => {
    if (!router.isReady) return;

    const urlFilters = parseUrlParams();

    if (Object.keys(urlFilters).length > 0) {
      setLocalFilters((prevFilters) => ({
        ...prevFilters,
        ...urlFilters,
      }));
    } else {
      setLocalFilters({
        sectoralFocus: availableSectoralFocus,
        sectors: availableSectors,
        problemClass: availableProblemClasses,
        application: availableApplications,
        modelName: availableModels,
        problemSize: availableProblemSizes,
        realistic: [RealisticOption.Realistic, RealisticOption.Other],
      });
    }
    setIsInit(true);
  }, [router.isReady, fullMetaData]);

  // Update URL when filters change
  useEffect(() => {
    if (!isInit) return;

    const queryParams = new URLSearchParams();
    Object.entries(localFilters).forEach(([key, values]) => {
      if (
        Array.isArray(values) &&
        values.length > 0 &&
        values.length <
          (key === "sectoralFocus"
            ? availableSectoralFocus.length
            : key === "sectors"
              ? availableSectors.length
              : key === "problemClass"
                ? availableProblemClasses.length
                : key === "application"
                  ? availableApplications.length
                  : key === "modelName"
                    ? availableModels.length
                    : key === "problemSize"
                      ? availableProblemSizes.length
                      : key === "realistic"
                        ? 2
                        : 0)
      ) {
        queryParams.set(key, values.map(encodeValue).join(";"));
      }
    });

    router.replace(
      {
        pathname: router.pathname,
        query: Object.fromEntries(queryParams),
      },
      undefined,
      { shallow: true },
    );
  }, [localFilters, isInit]);

  return (
    <div className="pl-1 pb-1 pr-3 bg-[#F4F6FA] rounded-xl">
      <div className="flex items-center justify-between gap-2 py-6 ml-5 mr-7">
        <div className="text-navy">
          <div className="font-lato font-bold text-2xl/1.4">Benchmark Set</div>
        </div>
        <div className="py-2 grid sm:flex justify-between items-center gap-2">
          <Link
            className="w-max text-green-pop text-opacity-80 border border-green-pop border-opacity-40 bg-white px-4 py-2 rounded-lg flex gap-1 items-center cursor-pointer 4xl:text-xl"
            href={PATH_DASHBOARD.benchmarkDetail.list}
          >
            Benchmark Set
          </Link>
          <Link
            className="w-max text-white bg-green-pop px-4 py-2 rounded-lg flex gap-1 items-center cursor-pointer 4xl:text-xl"
            href={PATH_DASHBOARD.benchmarkSummary}
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

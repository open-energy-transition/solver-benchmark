import { useSelector } from "react-redux";
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IFilterState, IResultState, RealisticOption } from "@/types/state";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import BenchmarkSummaryTable from "@/components/admin/benchmarks/BenchmarkSummaryTable";

const PageBenchmarkDetail = () => {
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
  };

  Object.keys(fullMetaData).forEach((key) => {
    const { sectoralFocus, sectors, problemClass, application, modelName } =
      fullMetaData[key];
    uniqueValues.sectoralFocus.add(sectoralFocus);
    uniqueValues.sectors.add(sectors);
    uniqueValues.problemClasses.add(problemClass);
    uniqueValues.applications.add(application);
    uniqueValues.models.add(modelName);
  });

  const availableSectoralFocus = Array.from(uniqueValues.sectoralFocus);
  const availableSectors = Array.from(uniqueValues.sectors);
  const availableProblemClasses = Array.from(uniqueValues.problemClasses);
  const availableApplications = Array.from(uniqueValues.applications);
  const availableModels = Array.from(uniqueValues.models);
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
          (key === "sectors"
            ? availableSectors.length
            : key === "problemClass"
              ? availableProblemClasses.length
              : key === "application"
                ? availableApplications.length
                : key === "modelName"
                  ? availableModels.length
                  : key === "problemSize"
                    ? availableProblemSizes.length
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
    <>
      <Head>
        <title>Benchmark Detail</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper>
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1 4xl:text-lg">
              <div className="flex items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem 4xl:size-5" />
                </Link>
                <ArrowIcon
                  fill="none"
                  className="size-3 stroke-navy 4xl:size-4"
                />

                <Link href={PATH_DASHBOARD.benchmarkDetail.list}>
                  <span className="self-center font-semibold whitespace-nowrap">
                    Benchmark Details
                  </span>
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <span className="self-center font-semibold whitespace-nowrap">
                  Feature Distribution
                </span>
              </div>
            </div>
          </AdminHeader>
          <div className="py-2 mb-2">
            <div className="text-navy text-xl font-bold">
              Distribution of Model Features in Benchmark Set
            </div>
          </div>
          {/* Content */}
          <BenchmarkSummaryTable />
        </ContentWrapper>
        <Footer />
      </div>
    </>
  );
};

export default PageBenchmarkDetail;

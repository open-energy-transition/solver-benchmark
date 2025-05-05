import { useSelector } from "react-redux";
// local
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import BenchmarkTableResult from "@/components/admin/benchmark-detail/BenchmarkTableResult";
import { ArrowIcon, ArrowUpIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import BenchmarkDetailFilterSection from "@/components/admin/benchmark-detail/BenchmarkDetailFilterSection";
import { IFilterState, IResultState } from "@/types/state";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import BenchmarkStatisticsCharts from "@/components/admin/benchmarks/BenchmarkStatisticsCharts";

const PageBenchmarkDetail = () => {
  const router = useRouter();
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const fullMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  const problemSizeResult: { [key: string]: string } = {};
  Object.keys(fullMetaData).forEach((metaDataKey) => {
    fullMetaData[metaDataKey]?.sizes?.forEach((s) => {
      problemSizeResult[`${metaDataKey}'-'${s.name}`] = s.size;
    });
  });

  const uniqueValues = {
    sectors: new Set<string>(),
    techniques: new Set<string>(),
    kindOfProblems: new Set<string>(),
    models: new Set<string>(),
  };

  Object.keys(fullMetaData).forEach((key) => {
    const { sectors, technique, kindOfProblem, modelName } = fullMetaData[key];
    uniqueValues.sectors.add(sectors);
    uniqueValues.techniques.add(technique);
    uniqueValues.kindOfProblems.add(kindOfProblem);
    uniqueValues.models.add(modelName);
  });

  const availableSectors = Array.from(uniqueValues.sectors);
  const availableTechniques = Array.from(uniqueValues.techniques);
  const availableKindOfProblems = Array.from(uniqueValues.kindOfProblems);
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
      "sectors",
      "technique",
      "kindOfProblem",
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
    sectors: availableSectors,
    technique: availableTechniques,
    kindOfProblem: availableKindOfProblems,
    modelName: availableModels,
    problemSize: availableProblemSizes,
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
        sectors: availableSectors,
        technique: availableTechniques,
        kindOfProblem: availableKindOfProblems,
        modelName: availableModels,
        problemSize: availableProblemSizes,
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
            : key === "technique"
              ? availableTechniques.length
              : key === "kindOfProblem"
                ? availableKindOfProblems.length
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

  const filteredMetaData = useMemo(() => {
    const filteredEntries = Object.entries(metaData).filter(([, value]) => {
      const { sectors, technique, kindOfProblem, modelName } = localFilters;

      const isSectorsMatch =
        sectors.length === 0 || sectors.includes(value.sectors);
      const isTechniqueMatch =
        technique.length === 0 || technique.includes(value.technique);
      const isKindOfProblemMatch =
        kindOfProblem.length === 0 ||
        kindOfProblem.includes(value.kindOfProblem);
      const isModelNameMatch =
        modelName.length === 0 || modelName.includes(value.modelName);
      return (
        isSectorsMatch &&
        isTechniqueMatch &&
        isKindOfProblemMatch &&
        isModelNameMatch
      );
    });

    return Object.fromEntries(filteredEntries);
  }, [localFilters, fullMetaData]);
  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`
        min-h-[calc(100vh-var(--footer-height))]
        px-2
        sm:px-6
        transition-all
        text-navy
        ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
        `}
        >
          <div className="max-w-8xl mx-auto">
            <div>
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1 4xl:text-lg">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-[1.125rem] h-[1.125rem 4xl:size-5" />
                    </Link>
                    <ArrowIcon
                      fill="none"
                      className="size-3 4xl:size-4 stroke-navy"
                    />
                    <span className="self-center font-semibold whitespace-nowrap">
                      Benchmark Set
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <div className="text-navy">
                <div className="font-lato font-bold text-2xl/1.4">
                  Benchmark Set
                </div>
                <p className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                  On this page you can see details of all the benchmarks on our
                  platform, including their source and download links.
                </p>
              </div>
            </div>
            <div className="bg-[#E6ECF5] border border-stroke border-t-0 pb-6 p-8 mt-6 rounded-[32px]">
              <div className="sm:flex justify-between">
                <div className="sm:x-0 sm:w-[224px] overflow-hidden bg-[#F4F6FA] rounded-xl h-max">
                  <BenchmarkDetailFilterSection
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    availableSectors={availableSectors}
                    availableTechniques={availableTechniques}
                    availableKindOfProblems={availableKindOfProblems}
                    availableModels={availableModels}
                    availableProblemSizes={availableProblemSizes}
                  />
                </div>
                <div
                  className={`
                pd:mx-0
                3xl:mx-auto
                sm:w-4/5 px-4
                `}
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="py-2 grid sm:flex justify-between items-center">
                      <div className="text-navy text-lg font-bold 4xl:text-xl">
                        Summary of Benchmark Set
                      </div>
                      <Link
                        className="w-max text-white bg-green-pop px-4 py-2 rounded-lg flex gap-1 items-center cursor-pointer 4xl:text-xl"
                        href={PATH_DASHBOARD.benchmarkSummary}
                      >
                        See more details
                        <ArrowUpIcon className="rotate-90" />
                      </Link>
                    </div>
                    <BenchmarkStatisticsCharts
                      availableSectors={availableSectors}
                      availableTechniques={availableTechniques}
                      availableKindOfProblems={availableKindOfProblems}
                      availableModels={availableModels}
                      availableProblemSizes={availableProblemSizes}
                    />
                    <div className="py-2">
                      <div className="text-navy text-lg font-bold 4xl:text-xl">
                        List of All Benchmarks
                      </div>
                    </div>
                    <BenchmarkTableResult metaData={filteredMetaData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PageBenchmarkDetail;

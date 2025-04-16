import { useSelector } from "react-redux";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IFilterState, IResultState } from "@/types/state";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import BenchmarkSummaryTable from "@/components/admin/benchmarks/BenchmarkSummaryTable";

const PageBenchmarkDetail = () => {
  const router = useRouter();
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

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

  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${
            isNavExpanded ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
              <div className="flex items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />

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
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PageBenchmarkDetail;

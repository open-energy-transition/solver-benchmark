import { useSelector } from "react-redux";
// local
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import BenchmarkTableResult from "@/components/admin/benchmark-detail/BenchmarkTableResult";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import BenchmarkDetailFilterSection from "@/components/admin/benchmark-detail/BenchmarkDetailFilterSection";
import { IResultState, RealisticOption } from "@/types/state";
import { useMemo, useState } from "react";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import { isEmpty } from "lodash";

const PageBenchmarkDetail = () => {
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
    uniqueValues.sectoralFocus.add(sectoralFocus);
    sectors.split(",").forEach((sector) => {
      uniqueValues.sectors.add(sector.trim());
    });
    uniqueValues.problemClasses.add(problemClass);
    uniqueValues.applications.add(application);
    uniqueValues.modellingFrameworks.add(modellingFramework);
  });

  const availableSectoralFocus = Array.from(uniqueValues.sectoralFocus);
  const availableSectors = Array.from(uniqueValues.sectors);
  const availableProblemClasses = Array.from(uniqueValues.problemClasses);
  const availableApplications = Array.from(uniqueValues.applications);
  const availableProblemSizes = Array.from(
    new Set(
      Object.keys(problemSizeResult).map((key) => problemSizeResult[key]),
    ),
  );
  const availableModellingFrameworks = Array.from(
    uniqueValues.modellingFrameworks,
  );

  const [localFilters, setLocalFilters] = useState<IFilterBenchmarkDetails>({
    sectoralFocus: availableSectoralFocus,
    sectors: availableSectors,
    problemClass: availableProblemClasses,
    application: availableApplications,
    problemSize: availableProblemSizes,
    modellingFramework: availableModellingFrameworks,
    realistic: [RealisticOption.Realistic, RealisticOption.Other],
  });

  const filteredMetaData = useMemo(() => {
    const filteredEntries = Object.entries(fullMetaData).filter(([, value]) => {
      const {
        sectoralFocus,
        sectors,
        problemClass,
        application,
        problemSize,
        realistic,
        modellingFramework,
      } = localFilters;

      const isSectoralFocusMatch =
        sectoralFocus.length === 0 ||
        sectoralFocus.includes(value.sectoralFocus);
      const isSectorsMatch =
        sectors.length === 0 ||
        (value.sectors &&
          sectors.some((selectedSector) => {
            const valueSectors = value.sectors.split(",").map((s) => s.trim());
            return valueSectors.includes(selectedSector);
          }));
      const isProblemClassMatch =
        problemClass.length === 0 || problemClass.includes(value.problemClass);
      const isApplicationMatch =
        application.length === 0 || application.includes(value.application);
      const isModellingFrameworkMatch =
        modellingFramework.length === 0 ||
        modellingFramework.includes(value.modellingFramework);
      const isProblemSizeMatch =
        problemSize.length === 0 ||
        (value.sizes &&
          value.sizes.some((size) => problemSize.includes(size.size)));

      const isRealisticMatch =
        realistic.length === 0 ||
        (value.sizes &&
          value.sizes.some((size) => {
            if (
              size.realistic === true &&
              realistic.includes(RealisticOption.Realistic)
            ) {
              return true;
            }
            if (
              (size.realistic === false || size.realistic === undefined) &&
              realistic.includes(RealisticOption.Other)
            ) {
              return true;
            }
            return false;
          }));

      return (
        isSectoralFocusMatch &&
        isSectorsMatch &&
        isProblemClassMatch &&
        isApplicationMatch &&
        isProblemSizeMatch &&
        isRealisticMatch &&
        isModellingFrameworkMatch
      );
    });
    return Object.fromEntries(filteredEntries);
  }, [localFilters, fullMetaData]);

  if (isEmpty(fullMetaData))
    return <div className="text-center">Loading...</div>;

  return (
    <>
      <Head>
        <title>Benchmark Set | Open Energy Benchmark</title>
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
        mt-16
        md:mt-0
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
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-50">
                      Benchmark Set
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <div className="md:flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h5>Benchmark Set</h5>
                  <p className="mb-6 mt-4 max-w-screen-lg">
                    On this page you can see a list of all the benchmark
                    problems on our platform. Click on a benchmark problem name
                    to see all the details about the problem, including links to
                    download the problem file, solution files, and logs.
                  </p>
                </div>
                <Link
                  href={PATH_DASHBOARD.featureDistribution}
                  className="text-white bg-navy px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap mt-1"
                >
                  Feature Distribution
                </Link>
              </div>
            </div>
            <div className="bg-[#E6ECF5] border border-stroke border-t-0 px-4 pb-4 mt-6 rounded-[32px]">
              <h6 className="py-4 pl-3.5">List of All Benchmarks</h6>
              <div className="block md:flex overflow-hidden rounded-xl gap-5">
                <div className="bg-[#F4F6FA] md:max-w-[255px] rounded-xl h-max">
                  <BenchmarkDetailFilterSection
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    availableSectoralFocus={availableSectoralFocus}
                    availableSectors={availableSectors}
                    availableProblemClasses={availableProblemClasses}
                    availableApplications={availableApplications}
                    availableProblemSizes={availableProblemSizes}
                    availableModellingFrameworks={availableModellingFrameworks}
                  />
                </div>
                <div className="w-full overflow-auto">
                  <div className="space-y-4 sm:space-y-6">
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

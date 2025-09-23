import { useSelector } from "react-redux";
// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowIcon, ArrowUpIcon, HomeIcon } from "@/assets/icons";
import { useMemo } from "react";
import { Color } from "@/constants/color";
import InstancesTableResult from "@/components/admin/benchmark-detail/InstancesTableResult";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";
import DataTable from "@/components/admin/benchmark-detail/DataTable";
import SolverRuntimeComparison from "@/components/admin/benchmark-detail/SolverRuntimeComparison";
import InfoPopup from "@/components/common/InfoPopup";

const PageBenchmarkDetail = () => {
  const router = useRouter();

  const benchmarkName = router.query.slug;

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => result.benchmark === benchmarkName);

  const benchmarkDetail = useMemo(
    () => metaData[benchmarkName as string],
    [metaData],
  );

  if (!benchmarkDetail) return <div></div>;

  const columns = [
    {
      name: "name",
      label: "Model Name",
      value: benchmarkName,
    },
    {
      name: "modellingFramework",
      label: "Modelling Framework",
      value: benchmarkDetail?.modellingFramework,
    },
    {
      name: "version",
      label: "version",
      value: benchmarkDetail?.version,
    },
    {
      name: "problemClass",
      label: "problem class",
      value: benchmarkDetail?.problemClass,
    },
    {
      name: "application",
      label: "application",
      value: benchmarkDetail?.application,
    },
    {
      name: "sectoralFocus",
      label: "Sectoral focus",
      value: benchmarkDetail?.sectoralFocus,
    },
    {
      name: "sectors",
      label: "sectors",
      value: benchmarkDetail?.sectors,
    },
    {
      name: "timeHorizon",
      label: "Time horizon",
      value: benchmarkDetail?.timeHorizon,
    },
    {
      name: "milpFeatures",
      label: "MILP feature",
      value: benchmarkDetail?.milpFeatures,
    },
  ];
  return (
    <>
      <Head>
        <title>{benchmarkName} | Open Energy Benchmark</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <ContentWrapper
          header={
            <AdminHeader>
              <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                <div className="flex flex-wrap items-center gap-1">
                  <Link href={PATH_DASHBOARD.root}>
                    <HomeIcon className="w-[1.125rem] h-[1.125rem]" />
                  </Link>
                  <ArrowIcon fill="none" className="size-3 stroke-navy" />
                  <Link
                    href={PATH_DASHBOARD.benchmarkSet.list}
                    className="self-center font-semibold whitespace-normal md:whitespace-nowrap"
                  >
                    Benchmark Details
                  </Link>
                  <ArrowIcon fill="none" className="size-3 stroke-navy" />
                  <p className="self-center font-semibold whitespace-normal md:whitespace-nowrap">
                    {benchmarkName}
                  </p>
                </div>
              </div>
            </AdminHeader>
          }
          showFilter={false}
        >
          {/* Content */}
          <div className="pb-2 md:py-4 md:pt-2 flex items-center">
            <Link href={"./"}>
              <ArrowUpIcon className="-rotate-90 size-8 md:size-10 text-navy cursor-pointer" />
            </Link>
            <InfoPopup
              trigger={() => (
                <h5 className="text-ellipsis overflow-hidden pl-1.5">
                  {benchmarkName}
                </h5>
              )}
              position="top center"
              closeOnDocumentClick
              arrowStyle={{ color: Color.Stroke }}
            >
              <div>{benchmarkName}</div>
            </InfoPopup>
          </div>
          <div className="text-navy bg-white px-3 md:px-6 py-4 md:py-8 rounded-lg">
            <div className="flex justify-between pb-4">
              <div className="pr-4 max-w-full md:max-w-[60%] text-sm md:text-base">
                {benchmarkDetail?.shortDescription}
              </div>
            </div>
            <div className="pr-4 pb-4 text-sm text-navy/70">
              <span className="font-semibold">Contributor(s)/Source:</span>{" "}
              {benchmarkDetail?.contributorSSource ? (
                <span className="hover:text-navy">
                  {benchmarkDetail.contributorSSource}
                </span>
              ) : (
                "-"
              )}
            </div>
            <div className="lg:bg-[#F4F6F8] flex flex-col md:flex-row py-2.5 rounded-lg gap-2 md:gap-0">
              {columns.map((col) => (
                <div
                  key={col.name}
                  className="border-b md:border-b-0 md:border-r last:border-none border-grey font-league w-full md:w-[14%] p-2 last:pl-2 md:last:pl-6 my-auto
        flex flex-col md:block bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none"
                >
                  <InfoPopup
                    trigger={() => (
                      <div className="font-bold text-base md:text-base overflow-hidden text-ellipsis whitespace-nowrap">
                        {col.value ?? "-"}
                      </div>
                    )}
                    position="top center"
                    closeOnDocumentClick
                    arrowStyle={{ color: Color.Stroke }}
                  >
                    <div>{col.value ?? "-"}</div>
                  </InfoPopup>
                  <div className="text-drak-green text-xs uppercase mt-1 md:mt-0">
                    {col.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {benchmarkDetail && (
            <>
              <InstancesTableResult benchmarkDetail={benchmarkDetail} />
              <h5 className="font-medium mb-2 mt-2 font-league pl-1.5">
                Results on this benchmark
              </h5>
              {benchmarkLatestResults.length > 1 ? (
                <>
                  <DataTable benchmarkName={benchmarkName as string} />
                  <SolverRuntimeComparison
                    benchmarkDetail={benchmarkDetail}
                    benchmarkName={benchmarkName as string}
                  />
                </>
              ) : (
                <div className="pl-2">No data available yet (coming soon!)</div>
              )}
            </>
          )}
        </ContentWrapper>
        <Footer />
      </div>
    </>
  );
};

export default PageBenchmarkDetail;

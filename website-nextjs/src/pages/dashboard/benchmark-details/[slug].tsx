import { useSelector } from "react-redux";
// local
import DetailSection from "@/components/admin/DetailSection";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowIcon, ArrowUpIcon, HomeIcon } from "@/assets/icons";
import { useMemo } from "react";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import InstancesTableResult from "@/components/admin/benchmark-detail/InstancesTableResult";
import BenchmarksSection from "@/components/admin/benchmark-detail/BenchmarksSection";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import MilpTableResult from "@/components/admin/benchmark-detail/MilpTableResult";
import { Technique } from "@/constants";
import { IResultState } from "@/types/state";

const PageBenchmarkDetail = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );
  const router = useRouter();

  const benchmarkName = router.query.slug;

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.metaData;
  });

  const benchmarkDetail = useMemo(
    () => metaData[benchmarkName as string],
    [metaData],
  );

  const columns = [
    {
      name: "name",
      label: "Model Name",
      value: benchmarkName,
    },
    {
      name: "version",
      label: "version",
      value: benchmarkDetail?.version,
    },
    {
      name: "technique",
      label: "technique",
      value: benchmarkDetail?.technique,
    },
    {
      name: "problemKind",
      label: "problem kind",
      value: benchmarkDetail?.kindOfProblem,
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
        <title>{benchmarkName}</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${
            isNavExpanded ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
              <div className="flex flex-wrap items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem]" />
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <Link
                  href={PATH_DASHBOARD.benchmarkDetail.list}
                  className="self-center font-semibold whitespace-normal md:whitespace-nowrap"
                >
                  Benchmark Details
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <span className="self-center font-semibold whitespace-normal md:whitespace-nowrap">
                  {benchmarkName}
                </span>
              </div>
            </div>
          </AdminHeader>
          {/* Content */}
          <DetailSection />
          <div className="border-b border-stroke pt-2" />

          <div className="pb-2 pt-8 md:py-4 flex items-center">
            <Link href={"./"}>
              <ArrowUpIcon className="-rotate-90 size-8 md:size-10 text-navy cursor-pointer" />
            </Link>
            <Popup
              on={["hover"]}
              trigger={() => (
                <div className="text-navy text-2xl md:text-4xl font-bold text-ellipsis overflow-hidden pl-1.5">
                  {benchmarkName}
                </div>
              )}
              position="top center"
              closeOnDocumentClick
              arrowStyle={{ color: Color.Stroke }}
            >
              <div className="bg-stroke p-2 rounded">{benchmarkName}</div>
            </Popup>
          </div>
          <div className="text-navy bg-white px-3 md:px-6 py-4 md:py-8 rounded-lg">
            <div className="flex justify-between pb-4">
              <div className="pr-4 max-w-full md:max-w-[60%] text-sm md:text-base">
                {benchmarkDetail?.shortDescription}
              </div>
            </div>
            <div className="bg-[#F4F6F8] flex flex-col md:flex-row py-2.5 rounded-lg">
              {columns.map((col) => (
                <div
                  key={col.name}
                  className="border-b md:border-b-0 md:border-r last:border-none border-grey font-league w-full md:w-[14%] p-2 last:pl-2 md:last:pl-6 my-auto"
                >
                  <Popup
                    on={["hover"]}
                    trigger={() => (
                      <div className="font-bold text-sm md:text-base overflow-hidden text-ellipsis whitespace-nowrap">
                        {col.value ?? "-"}
                      </div>
                    )}
                    position="top center"
                    closeOnDocumentClick
                    arrowStyle={{ color: Color.Stroke }}
                  >
                    <div className="bg-stroke p-2 rounded">
                      {col.value ?? "-"}
                    </div>
                  </Popup>
                  <div className="text-drak-green text-xs uppercase">
                    {col.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {benchmarkDetail && (
            <>
              <InstancesTableResult benchmarkDetail={benchmarkDetail} />
              {benchmarkDetail.technique === Technique.MILP && (
                <MilpTableResult benchmarkName={benchmarkName as string} />
              )}
              <BenchmarksSection benchmarkName={benchmarkName as string} />
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PageBenchmarkDetail;

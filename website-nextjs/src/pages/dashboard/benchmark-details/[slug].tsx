import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Footer, Navbar } from "@/components/shared"
import Head from "next/head"
import { useRouter } from "next/router"
import { ArrowToRightIcon, ArrowUpIcon } from "@/assets/icons"
import { ResultState } from "@/redux/results/reducer"
import { useMemo } from "react"
import Popup from "reactjs-popup"
import { Color } from "@/constants/color"
import InstancesTableResult from "@/components/admin/benchmark-detail/InstancesTableResult"
import BenchmarksSection from "@/components/admin/benchmark-detail/BenchmarksSection"
import Link from "next/link"

const PageBenchmarkDetail = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )
  const router = useRouter()

  const benchmarkName = router.query.slug

  const metaData = useSelector((state: { results: ResultState }) => {
    return state.results.metaData
  })

  const benchmarkDetail = useMemo(
    () => metaData[benchmarkName as string],
    [metaData]
  )

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
  ]

  return (
    <>
      <Head>
        <title>{benchmarkName}</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${
            isNavExpanded ? "ml-64" : "ml-20"
          }`}
        >
          <AdminHeader />
          {/* Content */}
          <DetailSection />
          <div className="border-b border-stroke pt-2" />

          <div className="pb-2 pt-16 flex items-center">
            <Link href={'./'}>
              <ArrowUpIcon className="-rotate-90 size-10 text-navy cursor-pointer" />
            </Link>
            <Popup
              on={["hover"]}
              trigger={() => (
                <div className="text-navy text-4xl font-bold text-ellipsis overflow-hidden pl-1.5">
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
          <div className="text-navy bg-white px-6 py-8 rounded-lg">
            <div className="flex justify-between pb-4">
              <div className="pr-4 max-w-[60%]">
                {benchmarkDetail?.shortDescription}
              </div>
              <div className="mt-2">
                <Link
                  href="https://github.com/open-energy-transition/solver-benchmark/blob/main/benchmarks/benchmark_config.yaml"
                  className="text-white bg-green-pop px-6 py-3 rounded-lg flex gap-1 items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                  <ArrowToRightIcon className="w-4 h-4 rotate-90" />
                </Link>
              </div>
            </div>
            <div className="bg-[#F4F6F8] flex py-2.5 rounded-lg">
              {columns.map((col) => (
                <div
                  key={col.name}
                  className="border-r last:border-r-0 border-grey font-league w-[14%] p-2 last:pl-6 my-auto"
                >
                  <Popup
                    on={["hover"]}
                    trigger={() => (
                      <div className="font-bold overflow-hidden text-ellipsis whitespace-nowrap">
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
              <InstancesTableResult
                benchmarkDetail={benchmarkDetail}
                benchmarkName={benchmarkName as string}
              />
              <BenchmarksSection benchmarkName={benchmarkName as string} />
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  )
}

export default PageBenchmarkDetail

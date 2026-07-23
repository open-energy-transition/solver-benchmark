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
import {
  ArrowIcon,
  ArrowToRightIcon,
  ArrowUpIcon,
  HomeIcon,
} from "@/assets/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color } from "@/constants/color";
import ProblemClassAndSize from "@/components/admin/benchmark-detail/ProblemClassAndSize";
import ProblemMetadataSections from "@/components/admin/benchmark-detail/ProblemMetadataSections";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";
import DataTable from "@/components/admin/benchmark-detail/DataTable";
import SolverRuntimeComparison from "@/components/admin/benchmark-detail/SolverRuntimeComparison";
import InfoPopup from "@/components/common/InfoPopup";
import BasicVsFeasible from "@/components/shared/BasicVsFeasible";
import { getProblemKey } from "@/utils/results";

const PageProblemDetail = () => {
  const router = useRouter();

  const problemId = router.query.problemId;

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => getProblemKey(result) === problemId);

  const problemDetail = useMemo(
    () => metaData[problemId as string],
    [metaData],
  );

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const el = titleRef.current;
      setIsTitleTruncated(!!el && el.scrollWidth > el.clientWidth);
    };
    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [problemId]);

  if (!problemDetail) return <div></div>;

  return (
    <>
      <Head>
        <title>{problemId} | Open Energy Benchmark</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <ContentWrapper
          header={
            <AdminHeader>
              <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                <div className="flex flex-wrap items-center gap-1">
                  <Link
                    href={PATH_DASHBOARD.root}
                    aria-label="Navigate to homep page"
                  >
                    <HomeIcon className="w-[1.125rem] h-[1.125rem]" />
                  </Link>
                  <ArrowIcon fill="none" className="size-3 stroke-navy" />
                  <Link
                    href={PATH_DASHBOARD.benchmarkSet.list}
                    aria-label="Navigate to benchmark problem set list page"
                    className="self-center font-semibold whitespace-normal md:whitespace-nowrap"
                  >
                    Benchmark Problem Set
                  </Link>
                  <ArrowIcon fill="none" className="size-3 stroke-navy" />
                  <p className="text-opacity-50 self-center font-semibold whitespace-normal md:whitespace-nowrap">
                    {problemId}
                  </p>
                </div>
              </div>
            </AdminHeader>
          }
          showFilter={false}
        >
          {/* Content */}
          <div className="pb-2 md:py-4 md:pt-2 flex items-center">
            <Link
              href={"./"}
              aria-label="Navigate to benchmark problem set list page"
            >
              <ArrowUpIcon className="-rotate-90 size-8 md:size-10 text-navy cursor-pointer" />
            </Link>
            <InfoPopup
              disabled={!isTitleTruncated}
              trigger={() => (
                <h1
                  ref={titleRef}
                  className="text-ellipsis overflow-hidden pl-1.5 h5"
                >
                  {problemId}
                </h1>
              )}
              position="top center"
              closeOnDocumentClick
              arrowStyle={{ color: Color.Stroke }}
            >
              <div>{problemId}</div>
            </InfoPopup>
          </div>
          <div className="text-navy bg-white px-3 md:px-6 py-4 md:py-8 rounded-lg">
            <div className="pr-4 pb-4 w-full text-sm md:text-base">
              <span className="font-semibold">Description:</span>{" "}
              {problemDetail?.shortDescription}
            </div>
            <div className="pr-4 pb-4 w-full text-sm md:text-base">
              <span className="font-semibold">Contributor(s)/Source:</span>{" "}
              {problemDetail?.contributorSSource ? (
                <span className="hover:text-navy">
                  {problemDetail.contributorSSource}
                </span>
              ) : (
                "-"
              )}
            </div>
            <div className="pr-4 pb-4 w-full text-sm md:text-base">
              <span className="font-semibold">License:</span>{" "}
              {problemDetail?.license ?? "None"}
            </div>
            {problemDetail?.url && (
              <div className="pr-4 text-sm md:text-base flex items-center gap-2">
                <span className="font-semibold">LP/MPS File:</span>
                <Link
                  href={problemDetail.url}
                  className="text-white bg-navy rounded-lg flex gap-1 items-center w-max px-4 py-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Download ${problemId} problem file`}
                >
                  Download
                  <ArrowToRightIcon className="w-4 h-4 rotate-90" />
                </Link>
              </div>
            )}
          </div>

          {problemDetail && (
            <>
              <ProblemClassAndSize problemDetail={problemDetail} />
              <ProblemMetadataSections problemDetail={problemDetail} />
              <h5 className="font-medium mb-2 mt-6 font-league">
                Results on this problem
              </h5>
              {benchmarkLatestResults.length > 1 ? (
                <>
                  <DataTable problemId={problemId as string} />
                  <SolverRuntimeComparison
                    problemDetail={problemDetail}
                    problemId={problemId as string}
                  />
                </>
              ) : (
                <div>No results available</div>
              )}
            </>
          )}
          {benchmarkLatestResults.length > 1 && <BasicVsFeasible />}
        </ContentWrapper>
        <Footer />
      </div>
    </>
  );
};

export default PageProblemDetail;

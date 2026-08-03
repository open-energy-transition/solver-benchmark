import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
// local
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";
import { decodeValue } from "@/utils/urls";
import { MAX_COMPARE_PROBLEMS } from "@/constants/filter";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getProblemKey } from "@/utils/results";
import ProblemsRuntimeComparison from "@/components/admin/benchmark-detail/ProblemsRuntimeComparison";
import BasicVsFeasible from "@/components/shared/BasicVsFeasible";

const PageCompareProblems = () => {
  const router = useRouter();

  const fullMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  const benchmarkResults = useBenchmarkResults();

  // Only keep problem ids that were actually found in the metadata (in case
  // of a stale/hand-edited link), and cap at the max, in case someone edits
  // the URL directly.
  const problemIds = useMemo(() => {
    const raw = router.query.problems;
    if (typeof raw !== "string" || !raw) return [];

    return raw
      .split(";")
      .map(decodeValue)
      .filter((id) => !!fullMetaData[id])
      .slice(0, MAX_COMPARE_PROBLEMS);
  }, [router.query.problems, fullMetaData]);

  const hasResults = useMemo(
    () =>
      problemIds.length > 0 &&
      benchmarkResults.some((result) =>
        problemIds.includes(getProblemKey(result)),
      ),
    [problemIds, benchmarkResults],
  );

  const problemIdsWithResults = useMemo(
    () => new Set(benchmarkResults.map(getProblemKey)),
    [benchmarkResults],
  );

  return (
    <>
      <Head>
        <title>Compare Problems | Open Energy Benchmark</title>
        <meta
          name="description"
          content="Compare the relative runtime of solvers across a hand-picked set of benchmark problems."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
          ${isNavExpanded ? "md:ml-72" : "md:ml-20"}
          `}
        >
          <div className="max-w-8xl mx-auto">
            <div>
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-70 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link
                      href={PATH_DASHBOARD.root}
                      aria-label="Dashboard home"
                    >
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <Link
                      href={PATH_DASHBOARD.benchmarkSet.list}
                      aria-label="Navigate to benchmark problem set list page"
                    >
                      <span className="self-center font-semibold whitespace-nowrap text-opacity-70">
                        Benchmark Problem Set
                      </span>
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-70">
                      Compare Problems
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h1 className="h5">Compare Problems</h1>
              {problemIds.length > 0 ? (
                <>
                  <p className="mt-4 mb-0 max-w-screen-lg">
                    Comparing the relative runtime of each solver on the problem
                    {problemIds.length > 1 ? "s " : " "}you selected. For each
                    problem, bars show every solver&apos;s runtime relative to
                    the fastest solver on that problem (lower is better).
                  </p>
                  <ul className="list-disc pl-6 mt-2 max-w-screen-lg">
                    {problemIds.map((id) => (
                      <li key={id}>
                        <Link
                          className="font-bold hover:underline underline-offset-4"
                          href={PATH_DASHBOARD.benchmarkSet.one.replace(
                            "{name}",
                            id,
                          )}
                        >
                          {id}
                        </Link>
                        {!problemIdsWithResults.has(id) && (
                          <span className="text-red-600">
                            {" "}
                            (No results available)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-4 mb-0 max-w-screen-lg">
                  This page compares the relative runtime of solvers across a
                  hand-picked set of benchmark problems. Go to the{" "}
                  <Link
                    className="font-bold hover:underline underline-offset-4"
                    href={PATH_DASHBOARD.benchmarkSet.list}
                  >
                    Benchmark Problem Set
                  </Link>{" "}
                  page, select up to {MAX_COMPARE_PROBLEMS} problems, and click{" "}
                  <b>Compare Selected</b> to see them here.
                </p>
              )}
            </div>
            <div className="bg-[#E6ECF5] border border-stroke border-t-0 p-4 mt-6 rounded-[32px]">
              {hasResults ? (
                <ProblemsRuntimeComparison
                  problemIds={problemIds}
                  metaData={fullMetaData}
                />
              ) : (
                <div className="px-6 py-4 text-navy font-lato border border-[#CAD9EF] bg-[#F4F6FA] rounded-2xl flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-navy shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold mb-1 h6">
                      {problemIds.length > 0
                        ? "No results are available yet for the selected problems."
                        : "No problems selected."}
                    </div>
                    <Link
                      className="font-bold hover:underline underline-offset-4"
                      href={PATH_DASHBOARD.benchmarkSet.list}
                    >
                      Go to the Benchmark Problem Set
                    </Link>
                  </div>
                </div>
              )}
              {hasResults && (
                <div className="mt-6">
                  <BasicVsFeasible />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PageCompareProblems;

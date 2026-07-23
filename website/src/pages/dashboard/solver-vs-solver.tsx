import { useSelector } from "react-redux";
// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import SolverSelection from "@/components/admin/compare-solvers/SolverSelection";
import Head from "next/head";
import { NoSolverPage } from "@/components/admin/compare-solvers/NoSolverPage";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";

const PageCompareSolvers = () => {
  const solversData = useSelector((state: { results: IResultState }) => {
    return state.results.solversData;
  });

  return (
    <>
      <Head>
        <title>Solver vs Solver | Open Energy Benchmark</title>
        <meta
          name="description"
          content="Compare any two solvers side by side on any subset of problems to identify performance differences and find where one solver outperforms another."
        />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div className="max-w-8xl mx-auto">
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root} aria-label="Home">
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-70">
                      Solver vs Solver
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h1 className="h5">Solver vs Solver</h1>
              <p className="mb-6 mt-4 max-w-screen-lg">
                This page lets you compare any two solvers (including versions)
                on any subset of the problems. This can be used to find
                problems where one solver performs better than another. It is
                also useful for solver developers who want to compare two
                versions of their solver to see on which problems the
                performance improved or degraded.
              </p>
            </div>
          }
        >
          {/* Content */}
          {solversData.length < 2 ? (
            <NoSolverPage />
          ) : (
            <>
              <SolverSelection />
            </>
          )}
        </ContentWrapper>
      </div>
      <Footer />
    </>
  );
};

export default PageCompareSolvers;

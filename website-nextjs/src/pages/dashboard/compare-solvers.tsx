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
        <title>Compare Solvers</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div className="max-w-8xl mx-auto">
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center whitespace-nowrap">
                      Compare Solvers
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h5>Compare Solvers</h5>
              <p className="mb-6 mt-4 max-w-screen-lg">
                This page lets you compare any two solvers (including versions)
                on any subset of the benchmarks. This can be used to find
                benchmarks where one solver performs better than another. It is
                also useful for solver developers who want to compare two
                versions of their solver to see on which benchmarks the
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

import { useSelector } from "react-redux";
// local
import DetailSection from "@/components/admin/DetailSection";
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
            <AdminHeader>
              <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1 4xl:text-lg">
                <div className="flex items-center gap-1">
                  <Link href={PATH_DASHBOARD.root}>
                    <HomeIcon className="w-[1.125rem] h-[1.125rem 4xl:size-5" />
                  </Link>
                  <ArrowIcon
                    fill="none"
                    className="size-3 stroke-navy 4xl:size-4"
                  />
                  <span className="self-center font-semibold whitespace-nowrap">
                    Compare Solvers
                  </span>
                </div>
              </div>
            </AdminHeader>
          }
        >
          {/* Content */}
          {solversData.length < 2 ? (
            <NoSolverPage />
          ) : (
            <>
              <DetailSection />
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

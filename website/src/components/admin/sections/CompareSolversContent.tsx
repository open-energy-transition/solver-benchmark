import { useSelector } from "react-redux";
import { AdminHeader, ContentWrapper } from "@/components/shared";
import SolverSelection from "@/components/admin/compare-solvers/SolverSelection";
import { NoSolverPage } from "@/components/admin/compare-solvers/NoSolverPage";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";

const CompareSolversContent = () => {
  const solversData = useSelector((state: { results: IResultState }) => {
    return state.results.solversData;
  });

  return (
    <ContentWrapper
      noPageMargin
      header={
        <div className="mt-8">
          <h5>Compare Solvers</h5>
          <p className="mb-6 mt-4 max-w-screen-lg">
            This page lets you compare any two solvers (including versions) on
            any subset of the benchmarks. This can be used to find benchmarks
            where one solver performs better than another. It is also useful for
            solver developers who want to compare two versions of their solver
            to see on which benchmarks the performance improved or degraded.
          </p>
        </div>
      }
    >
      {solversData.length < 2 ? <NoSolverPage /> : <SolverSelection />}
    </ContentWrapper>
  );
};

export default CompareSolversContent;

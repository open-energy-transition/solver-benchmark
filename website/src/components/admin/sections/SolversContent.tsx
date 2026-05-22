import { AdminHeader, ContentWrapper } from "@/components/shared";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SolverSection from "@/components/admin/solvers/SolverSection";

const SolversContent = () => {
  return (
    <ContentWrapper
      noPageMargin
      header={
        <div>
          <h5>Solvers</h5>
          <p className="mb-6 mt-4 max-w-screen-lg">
            This page shows details of each solver available on this platform,
            along with a relative performance plot that lets you compare the
            selected solver against all other solvers.
          </p>
        </div>
      }
    >
      <SolverSection />
    </ContentWrapper>
  );
};

export default SolversContent;

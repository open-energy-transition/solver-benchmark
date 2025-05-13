// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SolverSection from "@/components/admin/solvers/SolverSection";

const PageSolvers = () => {
  return (
    <>
      <Head>
        <title>Solvers</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div>
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1 4xl:text-lg">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-[1.125rem] h-[1.125rem 4xl:size-5" />
                    </Link>
                    <ArrowIcon
                      fill="none"
                      className="size-3 4xl:size-4 stroke-navy"
                    />
                    <span className="self-center font-semibold whitespace-nowrap">
                      Solvers
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <div className="font-lato font-bold text-2xl/1.4">Solvers</div>
              <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                This page shows details of each solver available on this
                platform, along with a relative performance plot that lets you
                compare the selected solver against all other solvers.
              </div>
            </div>
          }
        >
          <>
            <SolverSection />
          </>
        </ContentWrapper>
      </div>
      <Footer />
    </>
  );
};

export default PageSolvers;

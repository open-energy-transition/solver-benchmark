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

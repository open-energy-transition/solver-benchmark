import { useSelector } from "react-redux";
// local
import DetailSection from "@/components/admin/DetailSection";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import FilterSection from "@/components/admin/FilterSection";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SolverSection from "@/components/admin/solvers/SolverSection";

const PageSolvers = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <Head>
        <title>Solvers</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))]
           ${isNavExpanded ? "ml-[17rem]" : "ml-20"}`}
        >
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
              <div className="flex items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <span className="self-center font-semibold whitespace-nowrap">
                  Solvers
                </span>
              </div>
            </div>
          </AdminHeader>

          <>
            <DetailSection />
            <FilterSection />
            <SolverSection />
          </>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PageSolvers;

import { useSelector } from "react-redux";
// local
import DetailSection from "@/components/admin/DetailSection";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import TableResult from "@/components/admin/raw-result/TableResult";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import FilterSection from "@/components/admin/FilterSection";

const PagePerformanceHistory = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <Head>
        <title>Full Results</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${
            isNavExpanded ? "ml-64" : "ml-20"
          }`}
        >
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
              <div className="flex items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <span className="self-center font-semibold whitespace-nowrap">
                  Full Result
                </span>
              </div>
            </div>
          </AdminHeader>
          {/* Content */}
          <DetailSection />
          <FilterSection />
          <TableResult />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PagePerformanceHistory;

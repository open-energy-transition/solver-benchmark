// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import TableResult from "@/components/admin/raw-result/TableResult";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";

const PagePerformanceHistory = () => {
  return (
    <>
      <Head>
        <title>Full Results</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div className="max-w-8xl mx-auto">
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
                      Full Results
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <div className="font-lato font-bold text-2xl/1.4">
                Full Results
              </div>
              <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                This page contains the full and raw set of benchmark results
                from our platform. You can, as usual, filter the results to your
                area of interest and download the filtered data as a CSV file.
              </div>
            </div>
          }
        >
          {/* Content */}
          <TableResult />
        </ContentWrapper>
        <Footer />
      </div>
    </>
  );
};

export default PagePerformanceHistory;

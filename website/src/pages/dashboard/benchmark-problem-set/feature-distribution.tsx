import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import BenchmarkSummaryTable from "@/components/admin/benchmarks/BenchmarkSummaryTable";

const PageFeatureDistribution = () => {
  return (
    <>
      <Head>
        <title>Feature Distribution</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          showFilter={false}
          header={
            <div>
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root} aria-label="Home">
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />

                    <Link
                      href={PATH_DASHBOARD.benchmarkSet.list}
                      aria-label="Navigate to benchmark problem set list page"
                    >
                      <span className="self-center font-semibold whitespace-nowrap text-gray-600">
                        Benchmark Problem Set
                      </span>
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <span className="self-center font-semibold whitespace-nowrap text-gray-600 ">
                      Feature Distribution
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <h1 className="h5">Feature Distribution</h1>
              <p className="mb-6 mt-4 max-w-screen-lg">
                Distribution of features in benchmark problem set
              </p>
            </div>
          }
        >
          {/* Content */}
          <BenchmarkSummaryTable />
        </ContentWrapper>
        <Footer />
      </div>
    </>
  );
};

export default PageFeatureDistribution;

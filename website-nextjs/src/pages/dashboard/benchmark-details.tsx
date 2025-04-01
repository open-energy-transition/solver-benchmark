import { useSelector } from "react-redux";
// local
import DetailSection from "@/components/admin/DetailSection";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import FilterSection from "@/components/admin/FilterSection";
import BenchmarkTableResult from "@/components/admin/benchmark-detail/BenchmarkTableResult";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";

const PageBenchmarkDetail = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
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
                  Benchmark Details
                </span>
              </div>
            </div>
          </AdminHeader>
          {/* Content */}
          <DetailSection useMetadataCount />
          <FilterSection />
          <div className="py-2">
            <div className="text-navy text-xl font-bold">Benchmarks</div>
            <p className="text-[#5D5D5D]">
              On this page you can see details of all the benchmarks on our
              platform, including their source and download links.
            </p>
          </div>
          <BenchmarkTableResult />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PageBenchmarkDetail;

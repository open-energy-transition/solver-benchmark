import { useSelector } from "react-redux";
// local
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { HomeIcon, PreviousIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import KeyInsights from "@/components/admin/KeyInsights";

const KeyInsightsPage = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <Head>
        <title>Key Insights</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`
          min-h-[calc(100vh-var(--footer-height))]
          px-2
          sm:px-6
          transition-all
          text-navy
          ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
          `}
        >
          <div className="max-w-8xl mx-auto">
            <div>
              <AdminHeader>
                <div className="flex text-navy text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1 ml-[-0.45rem]">
                    <PreviousIcon width={20} className="fill-navy" />
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-4 sm:w-[1.125rem] h-4 sm:h-[1.125rem]" />
                    </Link>
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-50">
                      Key Insights
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h5>Key Insights</h5>
            </div>
            <div>
              <KeyInsights />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default KeyInsightsPage;

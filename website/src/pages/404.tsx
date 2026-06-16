import Head from "next/head";
import Link from "next/link";
import { Header, FooterLandingPage } from "@/components/shared";
import { PATH_DASHBOARD, ROOT_PATH } from "@/constants/path";

const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>404 – Page Not Found | Open Energy Benchmark</title>
        <meta
          name="description"
          content="The page you're looking for doesn't exist."
        />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-[#F4F6FA] px-4 py-24">
          <div className="text-center max-w-lg">
            <p className="text-teal font-league font-bold uppercase tracking-widest text-sm mb-4">
              404 Error
            </p>
            <h1 className="text-navy font-lato font-extrabold text-5xl sm:text-7xl mb-6 leading-none">
              Page not found
            </h1>
            <p className="text-navy/70 font-lato text-lg sm:text-xl mb-10 leading-relaxed">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It
              may have been moved or the URL might be incorrect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={ROOT_PATH.home}
                className="bg-teal text-white font-bold font-lato px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Go to Home
              </Link>
              <Link
                href={PATH_DASHBOARD.home}
                className="border border-teal text-teal font-bold font-lato px-8 py-3.5 rounded-2xl hover:bg-teal/5 transition-colors"
              >
                View Results
              </Link>
            </div>
          </div>
        </main>
        <FooterLandingPage />
      </div>
    </>
  );
};

export default NotFoundPage;

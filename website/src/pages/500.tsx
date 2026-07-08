import Head from "next/head";
import Link from "next/link";
import { Header, FooterLandingPage } from "@/components/shared";
import { ROOT_PATH } from "@/constants/path";

const ServerErrorPage = () => {
  return (
    <>
      <Head>
        <title>500 – Server Error | Open Energy Benchmark</title>
        <meta
          name="description"
          content="An unexpected error occurred on our server."
        />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-[#F4F6FA] px-4 py-24">
          <div className="text-center max-w-lg">
            <p className="text-teal font-league font-bold uppercase tracking-widest text-sm mb-4">
              500 Error
            </p>
            <h1 className="text-navy font-lato font-extrabold text-5xl sm:text-7xl mb-6 leading-none">
              Server error
            </h1>
            <p className="text-navy/70 font-lato text-lg sm:text-xl mb-10 leading-relaxed">
              Something went wrong on our end. Please try again in a moment. If
              the problem persists, feel free to{" "}
              <Link
                href="https://github.com/open-energy-transition/solver-benchmark/issues"
                className="text-teal font-semibold underline underline-offset-2 hover:opacity-75"
                target="_blank"
                rel="noopener noreferrer"
              >
                report it on GitHub
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={ROOT_PATH.home}
                className="bg-teal text-white font-bold font-lato px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </main>
        <FooterLandingPage />
      </div>
    </>
  );
};

export default ServerErrorPage;

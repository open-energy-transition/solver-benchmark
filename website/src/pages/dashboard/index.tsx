import { useEffect } from "react";
import { useSelector } from "react-redux";
import Head from "next/head";
import { Footer, Navbar } from "@/components/shared";
import MainResultsContent from "@/components/admin/sections/MainResultsContent";
import BenchmarkSetContent from "@/components/admin/sections/BenchmarkSetContent";
import SolversContent from "@/components/admin/sections/SolversContent";
import CompareSolversContent from "@/components/admin/sections/CompareSolversContent";
import PerformanceHistoryContent from "@/components/admin/sections/PerformanceHistoryContent";
import FullResultsContent from "@/components/admin/sections/FullResultsContent";

const SECTION_IDS = [
  "main-results",
  "benchmark-set",
  "solvers",
  "compare-solvers",
  "performance-history",
  "full-results",
] as const;

const DashboardPage = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  // On load, scroll to the hash section if present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // As user scrolls, keep the URL hash in sync with the visible section
  useEffect(() => {
    const scroller = document.querySelector("main") ?? window;

    const handleScroll = () => {
      const threshold = window.innerHeight * 0.4;
      let activeId: string = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) {
          activeId = id;
        }
      }
      const newHash = activeId === "main-results" ? "" : `#${activeId}`;
      const currentHash = window.location.hash;
      if (newHash !== currentHash) {
        history.replaceState(null, "", `/dashboard${newHash}`);
        window.dispatchEvent(new Event("hashchange"));
      }
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Open Energy Benchmark</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`
            mt-16
            md:mt-0
            px-2
            sm:px-6
            transition-all
            text-navy
            ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
          `}
        >
          <section id="main-results">
            <MainResultsContent />
          </section>
          <section id="benchmark-set">
            <BenchmarkSetContent />
          </section>
          <section id="solvers">
            <SolversContent />
          </section>
          <section id="compare-solvers">
            <CompareSolversContent />
          </section>
          <section id="performance-history">
            <PerformanceHistoryContent />
          </section>
          <section id="full-results">
            <FullResultsContent />
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;

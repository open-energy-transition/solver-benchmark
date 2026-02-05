import "@/styles/globals.css";
import { useEffect, useRef } from "react";
import Head from "next/head";
import React from "react";
import ReactDOM from "react-dom";

import type { AppProps } from "next/app";
import { Provider, useDispatch } from "react-redux";

// local
import { fontClasses } from "@/styles/fonts";
import { wrapper } from "@/redux/store";
import resultActions from "@/redux/results/actions";
import filterActions from "@/redux/filters/actions";
import AdminLayout from "@/pages/AdminLayout";
import { getBenchmarkResults, getLatestBenchmarkResult } from "@/utils/results";
import { getMetaData } from "@/utils/meta-data";
import { BenchmarkResult } from "@/types/benchmark";
import { IFilterState, RealisticOption } from "@/types/state";
import { MetaData } from "@/types/meta-data";
import { useRouter } from "next/router";

// Initialize axe-core for accessibility testing in development
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

function App({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch();
  const initialized = useRef(false);
  const router = useRouter();

  const { store, props } = wrapper.useWrappedStore(pageProps);

  // Meta tag configuration
  const siteConfig = {
    title: "Open Energy Benchmark",
    description:
      "An open-source benchmark of optimization solvers on representative problems from the energy planning domain.",
    url: "https://openenergybenchmark.org",
    image: "https://openenergybenchmark.org/logo.png",
    siteName: "Open Energy Benchmark",
    twitterHandle: "@OETenergy",
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeData = async () => {
      const resultsRes = await getBenchmarkResults();

      const hipoResultsRes = await getBenchmarkResults(
        "/results/benchmark_results_hipo.csv",
      );
      const fullmetaData = await getMetaData();
      const metaData = await getMetaData();

      dispatch(resultActions.setFullMetaData(fullmetaData.benchmarks));

      const metaDataBenmarkKeys = Object.keys(metaData.benchmarks);
      // Filter sizes that exist in results
      metaDataBenmarkKeys.forEach((benchmarkKey) => {
        const benchmark = metaData.benchmarks[benchmarkKey];
        // Filter sizes that have matching results
        const validSizes = benchmark.sizes.filter((size) =>
          resultsRes.some(
            (result) =>
              result.benchmark === benchmarkKey && result.size === size.name,
          ),
        );

        if (benchmark.sizes.length !== validSizes.length) {
          benchmark.sizes = validSizes;
        }
      });
      const results = resultsRes.filter((result) => {
        return (
          metaDataBenmarkKeys.includes(result.benchmark) &&
          metaData.benchmarks[result.benchmark].sizes.some(
            (size) => size.name === result.size,
          )
        );
      });

      const hipoResults = hipoResultsRes.filter((result) => {
        return (
          metaDataBenmarkKeys.includes(result.benchmark) &&
          metaData.benchmarks[result.benchmark].sizes.some(
            (size) => size.name === result.size,
          )
        );
      });

      // Create new benchmarksMetaData with only filtered keys
      const benchmarksMetaData = metaDataBenmarkKeys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: metaData.benchmarks[key],
        }),
        {},
      ) as MetaData;

      const problemSizeResult: { [key: string]: string } = {};
      Object.keys(benchmarksMetaData).forEach((metaDataKey) => {
        benchmarksMetaData[metaDataKey]?.sizes?.forEach((s) => {
          problemSizeResult[`${metaDataKey}'-'${s.name}`] = s.size;
        });
      });

      const uniqueValues = {
        sectoralFocus: new Set<string>(),
        sectors: new Set<string>(),
        problemClasses: new Set<string>(),
        applications: new Set<string>(),
        models: new Set<string>(),
        modellingFrameworks: new Set<string>(),
      };

      Object.keys(benchmarksMetaData).forEach((key) => {
        const {
          sectoralFocus,
          sectors,
          problemClass,
          application,
          modelName,
          modellingFramework,
        } = benchmarksMetaData[key];
        uniqueValues.sectoralFocus.add(sectoralFocus);
        sectors.split(",").forEach((sector) => {
          uniqueValues.sectors.add(sector.trim());
        });
        uniqueValues.problemClasses.add(problemClass);
        uniqueValues.applications.add(application);
        uniqueValues.models.add(modelName);
        uniqueValues.modellingFrameworks.add(modellingFramework);
      });

      const availableSectoralFocus = Array.from(uniqueValues.sectoralFocus);
      const availableSectors = Array.from(uniqueValues.sectors);
      const availableProblemClasses = Array.from(uniqueValues.problemClasses);
      const availableApplications = Array.from(uniqueValues.applications);
      const availableModels = Array.from(uniqueValues.models);
      const availableModellingFrameworks = Array.from(
        uniqueValues.modellingFrameworks,
      );
      const availableProblemSizes = Array.from(
        new Set(
          Object.keys(problemSizeResult).map((key) => problemSizeResult[key]),
        ),
      );

      dispatch(resultActions.setMetaData(benchmarksMetaData));
      dispatch(resultActions.setBenchmarkResults(results as BenchmarkResult[]));
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(results as BenchmarkResult[]),
        ),
      );
      dispatch(
        resultActions.setBenchmarkHipoResults(
          getLatestBenchmarkResult(hipoResultsRes as BenchmarkResult[]),
        ),
      );

      dispatch(resultActions.setRawMetaData(benchmarksMetaData));
      dispatch(
        resultActions.setAvailableFilterData({
          availableSectoralFocus,
          availableSectors,
          availableProblemClasses,
          availableApplications,
          availableModels,
          availableModellingFrameworks,
          availableProblemSizes,
          realisticOptions: [RealisticOption.Realistic, RealisticOption.Other],
        }),
      );
      dispatch(
        resultActions.setRawBenchmarkResults(results as BenchmarkResult[]),
      );

      dispatch(
        filterActions.setFilter({
          sectoralFocus: availableSectoralFocus,
          sectors: availableSectors,
          problemClass: availableProblemClasses,
          application: availableApplications,
          modellingFramework: availableModellingFrameworks,
          problemSize: availableProblemSizes,
          realistic: [RealisticOption.Realistic, RealisticOption.Other],
          isReady: true,
        } as IFilterState),
      );
    };

    initializeData();
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      // Always scroll to top when a route change completes
      window.scrollTo(0, 0);

      // Also scroll the main element if it exists
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.scrollTo(0, 0);
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  const renderLayout = () => {
    return (
      <AdminLayout>
        <main className={`${fontClasses} bg-light-blue overflow-auto h-screen`}>
          <Component {...props} />
        </main>
      </AdminLayout>
    );
  };

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta
          name="keywords"
          content="energy benchmark, optimization algorithms, energy modeling, performance comparison, energy sectors, modeling frameworks"
        />
        <meta name="author" content="Open Energy Benchmark" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="EN" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={`${siteConfig.url}${router.asPath}`} />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />

        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />

        {/* Theme Color */}
        <meta name="theme-color" content="#022b3b" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteConfig.url}${router.asPath}`} />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:image" content={siteConfig.image} />
        <meta property="og:image:alt" content="Open Energy Benchmark" />
        <meta property="og:site_name" content={siteConfig.siteName} />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`${siteConfig.url}${router.asPath}`}
        />
        <meta property="twitter:title" content={siteConfig.title} />
        <meta property="twitter:description" content={siteConfig.description} />
        <meta property="twitter:image" content={siteConfig.image} />
        <meta property="twitter:image:alt" content="Open Energy Benchmark" />
        {siteConfig.twitterHandle && (
          <meta property="twitter:site" content={siteConfig.twitterHandle} />
        )}

        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: siteConfig.title,
              description: siteConfig.description,
              url: siteConfig.url,
              applicationCategory: "ReferenceApplication",
              operatingSystem: "All",
              publisher: {
                "@type": "Organization",
                name: "Open Energy Benchmark",
              },
            }),
          }}
        />
      </Head>
      <Provider store={store}>{renderLayout()}</Provider>
      <div id="re-captcha"></div>
    </>
  );
}

export default wrapper.withRedux(App);

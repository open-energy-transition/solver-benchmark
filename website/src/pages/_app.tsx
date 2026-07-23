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
import {
  getBenchmarkResults,
  getProblemKey,
  getLatestBenchmarkResult,
} from "@/utils/results";
import { getMetaData } from "@/utils/meta-data";
import { BenchmarkResult } from "@/types/benchmark";
import { IFilterState, RealisticOption } from "@/types/state";
import { MetaData } from "@/types/meta-data";
import { useRouter } from "next/router";
import { UNSPECIFIED_FILTER_VALUE } from "@/constants/filter";

// Initialize axe-core for accessibility testing in development.
// Debounced 3s (rather than axe-core/react's 1s default) so scans run after
// GSAP entrance/stagger animations settle, instead of catching elements
// mid-fade and flagging their transient partial-opacity color as a contrast
// violation.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 5000);
  });
}

type InnerAppProps = {
  Component: AppProps["Component"];
  props: AppProps["pageProps"];
  router: ReturnType<typeof useRouter>;
};

function InnerApp({ Component, props, router }: InnerAppProps) {
  const dispatch = useDispatch();
  const initialized = useRef(false);

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

      const fullmetaData = await getMetaData();
      const metaData = await getMetaData();

      dispatch(resultActions.setFullMetaData(fullmetaData.problems));

      const metaDataProblemKeys = Object.keys(metaData.problems);
      // A result matches an entry when its derived problem key
      // (`${Benchmark}-${Size}`) exists in the metadata.
      const results = resultsRes.filter((result) => {
        return metaDataProblemKeys.includes(getProblemKey(result));
      });

      // Create new problemsMetaData with only filtered keys
      const problemsMetaData = metaDataProblemKeys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: metaData.problems[key],
        }),
        {},
      ) as MetaData;

      const problemSizeResult: { [key: string]: string } = {};
      Object.keys(problemsMetaData).forEach((metaDataKey) => {
        const size = problemsMetaData[metaDataKey]?.size;
        if (size) {
          problemSizeResult[metaDataKey] = size;
        }
      });

      const uniqueValues = {
        sectoralFocus: new Set<string>(),
        sectors: new Set<string>(),
        problemClasses: new Set<string>(),
        applications: new Set<string>(),
        models: new Set<string>(),
        modellingFrameworks: new Set<string>(),
      };

      Object.keys(problemsMetaData).forEach((key) => {
        const {
          sectoralFocus,
          sectors,
          problemClass,
          application,
          modelName,
          modellingFramework,
        } = problemsMetaData[key];
        uniqueValues.sectoralFocus.add(sectoralFocus || UNSPECIFIED_FILTER_VALUE);
        if (sectors) {
          sectors.split(",").forEach((sector) => {
            uniqueValues.sectors.add(sector.trim());
          });
        } else {
          uniqueValues.sectors.add(UNSPECIFIED_FILTER_VALUE);
        }
        if (problemClass) {
          uniqueValues.problemClasses.add(problemClass);
        }
        uniqueValues.applications.add(application || UNSPECIFIED_FILTER_VALUE);
        if (modelName) {
          uniqueValues.models.add(modelName);
        }
        uniqueValues.modellingFrameworks.add(
          modellingFramework || UNSPECIFIED_FILTER_VALUE,
        );
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

      dispatch(resultActions.setMetaData(problemsMetaData));
      dispatch(resultActions.setBenchmarkResults(results as BenchmarkResult[]));
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(results as BenchmarkResult[]),
        ),
      );

      dispatch(resultActions.setRawMetaData(problemsMetaData));
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "Open Energy Benchmark",
              description: "Open benchmark of solvers for energy planning",
              license: "CC-BY-4.0",
              creator: {
                "@type": "Organization",
                name: "Open Energy Transition",
              },
            }),
          }}
        />
      </Head>
      {renderLayout()}
      <div id="re-captcha"></div>
    </>
  );
}

function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps);
  const router = useRouter();

  return (
    <Provider store={store}>
      <InnerApp Component={Component} props={props} router={router} />
    </Provider>
  );
}

export default App;

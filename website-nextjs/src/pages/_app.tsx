import "@/styles/globals.css";
import { useEffect, useRef } from "react";
import Head from "next/head";

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

function App({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch();
  const initialized = useRef(false);

  const { store, props } = wrapper.useWrappedStore(pageProps);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeData = async () => {
      const resultsRes = await getBenchmarkResults();

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
        sectors: new Set<string>(),
        problemClasses: new Set<string>(),
        applications: new Set<string>(),
        models: new Set<string>(),
      };

      Object.keys(benchmarksMetaData).forEach((key) => {
        const { sectors, problemClass, application, modelName } =
          benchmarksMetaData[key];
        uniqueValues.sectors.add(sectors);
        uniqueValues.problemClasses.add(problemClass);
        uniqueValues.applications.add(application);
        uniqueValues.models.add(modelName);
      });

      const availableSectors = Array.from(uniqueValues.sectors);
      const availableProblemClasses = Array.from(uniqueValues.problemClasses);
      const availableApplications = Array.from(uniqueValues.applications);
      const availableModels = Array.from(uniqueValues.models);
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

      dispatch(resultActions.setRawMetaData(benchmarksMetaData));
      dispatch(
        resultActions.setAvailableFilterData({
          availableSectors,
          availableProblemClasses,
          availableApplications,
          availableModels,
          availableProblemSizes,
          realisticOptions: [RealisticOption.Realistic, RealisticOption.Other],
        }),
      );
      dispatch(
        resultActions.setRawBenchmarkResults(results as BenchmarkResult[]),
      );

      dispatch(
        filterActions.setFilter({
          sectors: availableSectors,
          problemClass: availableProblemClasses,
          application: availableApplications,
          modelName: availableModels,
          problemSize: availableProblemSizes,
          realistic: [RealisticOption.Realistic, RealisticOption.Other],
          isReady: true,
        } as IFilterState),
      );
    };

    initializeData();
  }, []);

  const renderLayout = () => {
    return (
      <AdminLayout>
        <main
          className={`${fontClasses} bg-light-blue overflow-auto h-[calc(100vh-var(--banner-height))]`}
        >
          <Component {...props} />
        </main>
      </AdminLayout>
    );
  };
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>
      <Provider store={store}>{renderLayout()}</Provider>
    </>
  );
}

export default wrapper.withRedux(App);

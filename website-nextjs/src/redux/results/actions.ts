import { BenchmarkResult } from "@/types/benchmark";
import { MetaData } from "@/types/meta-data";
import { IAvailableFilterData } from "@/types/state";

const actions = {
  SET_BENCHMARK_RESULTS: "SET_BENCHMARK_RESULTS",
  SET_BENCHMARK_LATEST_RESULTS: "SET_BENCHMARK_LATEST_RESULTS",
  SET_META_DATA: "SET_META_DATA",
  SET_RAW_BENCHMARK_RESULTS: "SET_RAW_BENCHMARK_RESULTS",
  SET_RAW_META_DATA: "SET_RAW_META_DATA",
  SET_AVAILABLE_FILTER_DATA: "SET_AVAILABLE_FILTER_DATA",
  SET_FULL_META_DATA: "SET_FULL_META_DATA",

  setBenchmarkResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_BENCHMARK_RESULTS,
      payload: { results },
    };
  },
  setBenchmarkLatestResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_BENCHMARK_LATEST_RESULTS,
      payload: { results },
    };
  },
  setMetaData: (metaData: MetaData) => {
    return {
      type: actions.SET_META_DATA,
      payload: { metaData },
    };
  },
  setRawBenchmarkResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_RAW_BENCHMARK_RESULTS,
      payload: { results },
    };
  },
  setRawMetaData: (metaData: MetaData) => {
    return {
      type: actions.SET_RAW_META_DATA,
      payload: { metaData },
    };
  },
  setFullMetaData: (metaData: MetaData) => {
    return {
      type: actions.SET_FULL_META_DATA,
      payload: { metaData },
    };
  },
  setAvailableFilterData: (availableFilterData: IAvailableFilterData) => {
    return {
      type: actions.SET_AVAILABLE_FILTER_DATA,
      payload: { availableFilterData },
    };
  },
};

export default actions;

import { AnyAction } from "redux";
import { RootState } from "@/redux/store";
import { ThunkAction } from "redux-thunk";
import resultActions from "@/redux/results/actions";
import { BenchmarkResult } from "@/types/benchmark";
import { MetaData, MetaDataEntry, Size } from "@/types/meta-data";
import {
  checkRealisticFilter,
  getLatestBenchmarkResult,
} from "@/utils/results";
import { IFilterState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";

const toggleFilter = (category: string, value: string, only: boolean) => {
  return {
    type: actions.TOGGLE_FILTER,
    payload: { category, value, only },
  };
};

const setFilter = (filterState: IFilterState) => {
  return {
    type: actions.SET_FILTER,
    payload: filterState,
  };
};

const setSgmMode = (sgmMode: SgmMode) => {
  return {
    type: actions.SET_SGM_MODE,
    payload: { sgmMode },
  };
};

const setXFactor = (xFactor: number) => {
  return {
    type: actions.SET_X_FACTOR,
    payload: { xFactor },
  };
};

const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",
  SET_FILTER: "SET_FILTER",
  SET_SGM_MODE: "SET_SGM_MODE",
  SET_X_FACTOR: "SET_X_FACTOR",
  setFilter,
  setSgmMode,
  setXFactor,
  toggleFilter,
  toggleFilterAndUpdateResults:
    (payload: {
      category: string;
      value: string;
      only: boolean;
    }): ThunkAction<void, RootState, unknown, AnyAction> =>
    (dispatch, getState) => {
      dispatch(toggleFilter(payload.category, payload.value, payload.only));
      const { filters, results } = getState();
      const metaData = Object.fromEntries(
        Object.entries(results.rawMetaData).filter(([, _metaData]) => {
          const metaData = _metaData as MetaDataEntry;

          const isSectorsMatch =
            filters.sectors.length === 0 ||
            (metaData.sectors &&
              filters.sectors.some((selectedSector) => {
                const metaDataSectors = metaData.sectors
                  .split(",")
                  .map((s) => s.trim());
                return metaDataSectors.includes(selectedSector);
              }));

          return (
            filters.application.includes(metaData.application) &&
            filters.problemClass.includes(metaData.problemClass) &&
            filters.sectoralFocus.includes(metaData.sectoralFocus) &&
            isSectorsMatch &&
            filters.modellingFramework.includes(metaData.modellingFramework)
          );
        }),
      );

      const problemSizeResult: { [key: string]: string } = {};
      Object.keys(metaData).forEach((metaDataKey) => {
        if (!results.rawMetaData[metaDataKey]) {
          console.error(`Missing: ${metaDataKey}`);
          return;
        }
        results.rawMetaData[metaDataKey].sizes.forEach((s: Size) => {
          problemSizeResult[`${metaDataKey}'-'${s.name}`] = s.size;
        });
      });

      const benchmarkResults: BenchmarkResult[] =
        results.rawBenchmarkResults.filter((benchmark: BenchmarkResult) => {
          return (metaData[benchmark.benchmark] as MetaDataEntry)?.sizes?.find(
            (size) => {
              return (
                size.name === benchmark.size &&
                filters.problemSize.includes(
                  problemSizeResult[
                    `${benchmark.benchmark}'-'${benchmark.size}`
                  ],
                ) &&
                checkRealisticFilter(size, filters)
              );
            },
          );
        });

      dispatch(resultActions.setMetaData(metaData as MetaData));
      dispatch(resultActions.setBenchmarkResults(benchmarkResults));
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(benchmarkResults),
        ),
      );
    },
};

export default actions;

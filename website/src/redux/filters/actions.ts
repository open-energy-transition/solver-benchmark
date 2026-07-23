import { AnyAction } from "redux";
import { RootState } from "@/redux/store";
import { ThunkAction } from "redux-thunk";
import resultActions from "@/redux/results/actions";
import { BenchmarkResult } from "@/types/benchmark";
import { MetaData, MetaDataEntry } from "@/types/meta-data";
import {
  checkRealisticFilter,
  getProblemKey,
  getLatestBenchmarkResult,
} from "@/utils/results";
import { IFilterState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";
import { UNSPECIFIED_FILTER_VALUE } from "@/constants/filter";

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

const resetFilters =
  (): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    dispatch({ type: actions.RESET_FILTERS });

    const { results } = getState();
    dispatch(resultActions.setBenchmarkResults(results.rawBenchmarkResults));
    dispatch(
      resultActions.setBenchmarkLatestResults(
        getLatestBenchmarkResult(results.rawBenchmarkResults),
      ),
    );
    dispatch(resultActions.setMetaData(results.rawMetaData));
  };

const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",
  SET_FILTER: "SET_FILTER",
  SET_SGM_MODE: "SET_SGM_MODE",
  SET_X_FACTOR: "SET_X_FACTOR",
  RESET_FILTERS: "RESET_FILTERS",
  setFilter,
  setSgmMode,
  setXFactor,
  toggleFilter,
  resetFilters,
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

          const entrySectors = metaData.sectors;
          const isSectorsMatch =
            filters.sectors.length === 0 ||
            (entrySectors
              ? filters.sectors.some((selectedSector) => {
                  const metaDataSectors = entrySectors
                    .split(",")
                    .map((s) => s.trim());
                  return metaDataSectors.includes(selectedSector);
                })
              : filters.sectors.includes(UNSPECIFIED_FILTER_VALUE));

          return (
            filters.application.includes(
              metaData.application ?? UNSPECIFIED_FILTER_VALUE,
            ) &&
            filters.problemClass.includes(metaData.problemClass ?? "") &&
            filters.sectoralFocus.includes(
              metaData.sectoralFocus ?? UNSPECIFIED_FILTER_VALUE,
            ) &&
            isSectorsMatch &&
            filters.modellingFramework.includes(
              metaData.modellingFramework ?? UNSPECIFIED_FILTER_VALUE,
            )
          );
        }),
      );

      const benchmarkResults: BenchmarkResult[] =
        results.rawBenchmarkResults.filter((benchmark: BenchmarkResult) => {
          const entry = metaData[getProblemKey(benchmark)] as
            | MetaDataEntry
            | undefined;

          return (
            !!entry &&
            filters.problemSize.includes(entry.size ?? "") &&
            checkRealisticFilter(entry, filters)
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

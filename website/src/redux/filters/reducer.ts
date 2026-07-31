import { AnyAction } from "redux";

import actions from "./actions";
import { IFilterState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";

const { TOGGLE_FILTER, SET_FILTER, SET_SGM_MODE, SET_X_FACTOR, RESET_FILTERS } =
  actions;

const initialState: IFilterState = {
  benchmarks: [],
  application: [],
  modellingFramework: [],
  problemSize: [],
  sectoralFocus: [],
  sectors: [],
  solvers: [],
  statuses: [],
  problemClass: [],
  sgmMode: SgmMode.COMPUTE_SGM_USING_TO_VALUES,
  xFactor: 5,
  realistic: [],
  isReady: false,
};

const filterReducer = (
  state: IFilterState = initialState,
  action: AnyAction,
): IFilterState => {
  switch (action.type) {
    case SET_FILTER:
    case SET_SGM_MODE:
    case SET_SGM_MODE:
    case SET_X_FACTOR:
      return {
        ...state,
        ...action.payload,
      };
    case TOGGLE_FILTER:
      const { category, value, only } = action.payload as {
        category: keyof IFilterState;
        value: string;
        only: boolean;
      };

      if (only) {
        return {
          ...state,
          [category]: [value],
        };
      }

      return {
        ...state,
        [category]: (state[category] as (typeof value)[]).includes(value)
          ? (state[category] as (typeof value)[]).filter(
              (item) => item !== value,
            ) // Remove if already selected
          : [...(state[category] as (typeof value)[]), value], // Add if not selected
      };
    case RESET_FILTERS:
      return initialState;
    default:
      return state;
  }
};

export default filterReducer;

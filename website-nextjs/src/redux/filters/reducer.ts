import { AnyAction } from "redux";

import actions from "./actions";
import { IFilterState } from "@/types/state";
import { SgmMode } from "@/constants/filter";

const { TOGGLE_FILTER, SET_FILTER, SET_SGM_MODE, SET_X_FACTOR } = actions;

const initialState: IFilterState = {
  benchmarks: [],
  kindOfProblem: [],
  modelName: [],
  problemSize: [],
  sectors: [],
  solvers: [],
  statuses: [],
  technique: [],
  sgmMode: SgmMode.COMPUTE_SGM_USING_TO_VALUES,
  xFactor: 5,
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
    default:
      return state;
  }
};

export default filterReducer;

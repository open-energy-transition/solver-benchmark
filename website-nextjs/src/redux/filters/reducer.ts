import { AnyAction } from "redux"

import actions from "./actions"
import { IFilterState } from "@/types/state"

const { TOGGLE_FILTER, SET_FILTER } = actions

const initialState: IFilterState = {
  benchmarks: [],
  kindOfProblem: [],
  modelName: [],
  problemSize: [],
  sectors: [],
  solvers: [],
  statuses: [],
  technique: [],
}

const filterReducer = (
  state: IFilterState = initialState,
  action: AnyAction
): IFilterState => {
  switch (action.type) {
    case SET_FILTER:
      return {
        ...state,
        ...action.payload,
      }
    case TOGGLE_FILTER:
      const { category, value, only } = action.payload as {
        category: keyof IFilterState
        value: string
        only: boolean
      }

      if (only) {
        return {
          ...state,
          [category]: [value],
        }
      }

      return {
        ...state,
        [category]: (state[category] as (typeof value)[]).includes(value)
          ? (state[category] as (typeof value)[]).filter(
              (item) => item !== value
            ) // Remove if already selected
          : [...(state[category] as (typeof value)[]), value], // Add if not selected
      }

    default:
      return state
  }
}

export default filterReducer

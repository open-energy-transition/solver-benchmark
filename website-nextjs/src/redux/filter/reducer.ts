import { AnyAction } from "redux"
import { Sector, Technique, KindOfProblem, Model } from "@/constants"

import actions from "./actions"

const { TOGGLE_FILTER } = actions

export type FilterState = {
  sector: Sector[]
  technique: Technique[]
  kindOfProblem: KindOfProblem[]
  model: Model[]
}

const initialState: FilterState = {
  sector: [Sector.Power, Sector.SectorCoupled],
  technique: [Technique.MLIP, Technique.LP],
  kindOfProblem: [
    KindOfProblem.Infrastructure,
    KindOfProblem.Operational,
    KindOfProblem.DCOptimalPowerFlow,
    KindOfProblem.SteadyStateOptimalPowerFlow,
  ],
  model: [
    Model.PyPSA,
    Model.PyPSAEur,
    Model.PowerModel,
    Model.Tulipa,
    Model.Sienna,
    Model.GenX,
  ],
}

const filterReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case TOGGLE_FILTER:
      const { category, value } = action.payload as {
        category: keyof typeof initialState
        value: Sector | Technique | KindOfProblem | Model
      }

      return {
        ...state,
        [category]: state[category].includes(value)
          ? state[category].filter((item) => item !== value) // Remove if already selected
          : [...state[category], value], // Add if not selected
      }

    default:
      return state
  }
}

export default filterReducer

import { AnyAction } from "redux"
import actions from "./actions"

const { TOGGLE_NAV } = actions

const initialState = {
  sector: ["power", "sector_coupled"],
  technique: ["mlip", "lp"],
  kindOfProblem: [
    "infrastructure",
    "operational",
    "dc_optimal_power_flow",
    "steady_state_optimal_power_flow",
  ],
  model: ["PyPSA", "PyPSA_Eur", "Power_Model", "Tulipa", "Sienna", "Gen_X"],
}

const themeReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case TOGGLE_NAV:
      return {
        ...state,
      }
    default:
      return state
  }
}

export default themeReducer

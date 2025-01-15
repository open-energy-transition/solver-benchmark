import { AnyAction } from "redux";
import { Sector, Technique, KindOfProblem, Model } from "@/constants";

import actions from "./actions";

const { TOGGLE_FILTER } = actions;

export type FilterState = {
  sectors: Sector[];
  technique: Technique[];
  kindOfProblem: KindOfProblem[];
  modelName: Model[];
};

const initialState: FilterState = {
  sectors: [Sector.Power, Sector.SectorCoupled],
  technique: [Technique.MILP, Technique.LP],
  kindOfProblem: [
    KindOfProblem.Infrastructure,
    KindOfProblem.Operational,
    KindOfProblem.DCOptimalPowerFlow,
    KindOfProblem.SteadyStateOptimalPowerFlow,
  ],
  modelName: [
    Model.PyPSA,
    Model.PyPSAEur,
    Model.PowerModel,
    Model.Tulipa,
    Model.Sienna,
    Model.GenX,
  ],
};

const filterReducer = (
  state: FilterState = initialState,
  action: AnyAction
): FilterState => {
  switch (action.type) {
    case TOGGLE_FILTER:
      const { category, value } = action.payload as {
        category: keyof FilterState;
        value: Sector | Technique | KindOfProblem | Model;
      };

      return {
        ...state,
        [category]: (state[category] as typeof value[]).includes(value)
          ? (state[category] as typeof value[]).filter((item) => item !== value) // Remove if already selected
          : [...(state[category] as typeof value[]), value], // Add if not selected
      };

    default:
      return state;
  }
};

export default filterReducer;

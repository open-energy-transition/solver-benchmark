import { AnyAction } from "redux";
import actions from "./actions";

const {
    TOGGLE_NAV,
  } = actions;

const initialState = {
  isNavExpanded: true,
};

const themeReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case TOGGLE_NAV:
      return {
        ...state,
        isNavExpanded: !state.isNavExpanded,
      };
    default:
      return state;
  }
};

export default themeReducer;

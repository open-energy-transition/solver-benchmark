import { combineReducers } from "redux";
import themeReducer from "./theme/reducer";
import filterReduce from "./filters/reducer";
import resultsReducer from "./results/reducer";

const rootReducers = combineReducers({
  theme: themeReducer,
  filters: filterReduce,
  results: resultsReducer,
});

export type RootState = ReturnType<typeof rootReducers>;
export default rootReducers;

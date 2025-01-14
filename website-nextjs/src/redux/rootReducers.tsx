import { combineReducers } from "redux"
import themeReducer from "./theme/reducer";
import filterReduce from "./filter/reducer"
import resultsReducer from "./result/reducer";

const rootReducers = combineReducers({
    theme: themeReducer,
    filters: filterReduce,
    results: resultsReducer
})

export default rootReducers

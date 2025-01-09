import { combineReducers } from "redux"
import themeReducer from "./theme/reducer";

const rootReducers = combineReducers({
    theme: themeReducer,
})

export default rootReducers

import { createStore, applyMiddleware, AnyAction } from "redux";
import { thunk, ThunkDispatch } from "redux-thunk";
import { composeWithDevTools } from "@redux-devtools/extension";
import { createWrapper } from "next-redux-wrapper";
import rootReducer from "./rootReducers";

// initial states here
const initalState = {};

// middleware
const middleware = [thunk];

export const store = createStore(
  rootReducer,
  initalState,
  composeWithDevTools(applyMiddleware(...middleware)),
);

// assigning store to next wrapper
const makeStore = () => store;

export const wrapper = createWrapper(makeStore);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

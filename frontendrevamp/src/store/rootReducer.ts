import { combineReducers } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import authReducer from "./slices/authSlice";
import { baseApi } from "./services/baseApi";

// Add more slice reducers here as the app grows
// import jobsReducer from "./slices/jobsSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  // jobs: jobsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;

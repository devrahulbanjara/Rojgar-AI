import { combineReducers } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";

// Add more slice reducers here as the app grows
// import authReducer from "./slices/authSlice";
// import jobsReducer from "./slices/jobsSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  // auth: authReducer,
  // jobs: jobsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;

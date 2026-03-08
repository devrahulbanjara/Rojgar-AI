import { combineReducers } from '@reduxjs/toolkit'

import { baseApi } from './services/baseApi'
import authReducer from './slices/authSlice'
import resumeReducer from './slices/resumeSlice'
import uiReducer from './slices/uiSlice'

// Add more slice reducers here as the app grows
// import jobsReducer from "./slices/jobsSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  resumes: resumeReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  // jobs: jobsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer

import { combineReducers } from '@reduxjs/toolkit'

import { baseApi } from './services/baseApi'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'

const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer

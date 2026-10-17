import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface UiState {
  backendConnection: {
    hasIssue: boolean
    message: string | null
    lastDetectedAt: string | null
  }
}

const initialState: UiState = {
  backendConnection: {
    hasIssue: false,
    message: null,
    lastDetectedAt: null,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    reportBackendConnectionIssue(state, action: PayloadAction<string | undefined>) {
      state.backendConnection.hasIssue = true
      state.backendConnection.message = action.payload ?? 'Service temporarily unavailable.'
      state.backendConnection.lastDetectedAt = new Date().toISOString()
    },
    clearBackendConnectionIssue(state) {
      state.backendConnection.hasIssue = false
      state.backendConnection.message = null
      state.backendConnection.lastDetectedAt = null
    },
  },
})

export const { reportBackendConnectionIssue, clearBackendConnectionIssue } = uiSlice.actions
export default uiSlice.reducer

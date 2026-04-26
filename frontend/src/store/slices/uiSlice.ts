import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface UiState {
  isMobileMenuOpen: boolean
  theme: 'light' | 'dark'
  backendConnection: {
    hasIssue: boolean
    message: string | null
    lastDetectedAt: string | null
  }
  isRecruiterChatOpen: boolean
}

const initialState: UiState = {
  isMobileMenuOpen: false,
  theme: 'light',
  backendConnection: {
    hasIssue: false,
    message: null,
    lastDetectedAt: null,
  },
  isRecruiterChatOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    closeMobileMenu(state) {
      state.isMobileMenuOpen = false
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
    },
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
    toggleRecruiterChat(state) {
      state.isRecruiterChatOpen = !state.isRecruiterChatOpen
    },
    setRecruiterChatOpen(state, action: PayloadAction<boolean>) {
      state.isRecruiterChatOpen = action.payload
    },
  },
})

export const {
  toggleMobileMenu,
  closeMobileMenu,
  setTheme,
  reportBackendConnectionIssue,
  clearBackendConnectionIssue,
  toggleRecruiterChat,
  setRecruiterChatOpen,
} = uiSlice.actions
export default uiSlice.reducer

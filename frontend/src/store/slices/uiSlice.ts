import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface UiState {
  isMobileMenuOpen: boolean
  theme: 'light' | 'dark'
}

const initialState: UiState = {
  isMobileMenuOpen: false,
  theme: 'light',
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
  },
})

export const { toggleMobileMenu, closeMobileMenu, setTheme } = uiSlice.actions
export default uiSlice.reducer

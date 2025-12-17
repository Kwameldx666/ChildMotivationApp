import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthSession, AuthState } from '@/features/auth/types'

const initialState: AuthState = {
  session: null,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession | null>) {
      state.session = action.payload
      state.error = null
      state.status = 'idle'
    },
    setAuthStatus(state, action: PayloadAction<AuthState['status']>) {
      state.status = action.payload
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
      state.status = action.payload ? 'error' : 'idle'
    },
    clearSession() {
      return initialState
    },
  },
})

export const { setSession, setAuthStatus, setAuthError, clearSession } = authSlice.actions
export const authReducer = authSlice.reducer

export const selectAuthState = (state: { auth: AuthState }) => state.auth
export const selectAuthSession = (state: { auth: AuthState }) => state.auth.session
export const selectAuthRole = (state: { auth: AuthState }) => state.auth.session?.profile.role

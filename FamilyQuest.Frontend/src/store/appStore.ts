import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import { authReducer } from '@/features/auth/store/authSlice'

const createPersistStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: async () => null,
      setItem: async () => undefined,
      removeItem: async () => undefined,
    }
  }
  return createWebStorage('local')
}

const storage = createPersistStorage()

const authPersistConfig = {
  key: 'auth',
  storage,
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
})

export const appStore = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(appStore)

export type RootState = ReturnType<typeof appStore.getState>
export type AppDispatch = typeof appStore.dispatch

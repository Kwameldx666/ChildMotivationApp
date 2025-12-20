"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthSession, Screen } from '@/features/app/types'
import { authApi } from '@/features/auth/api/authApi'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearSession, selectAuthSession, setSession } from '@/features/auth/store/authSlice'

const SPLASH_DURATION_MS = 2000

export function useAppState() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const dispatch = useAppDispatch()
  const session = useAppSelector(selectAuthSession)
  const sessionRef = useRef<AuthSession | null>(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const resolveScreen = useCallback((nextSession: AuthSession | null): Screen => {
    if (!nextSession) return 'welcome'

    const role = nextSession.profile?.role
    if (!role) return 'auth'

    return role === 'parent' ? 'parent-dashboard' : 'child-dashboard'
  }, [])

  const bootstrap = useCallback(() => {
    setIsBootstrapping(true)
    const timer = setTimeout(async () => {
      try {
        const cachedSession = sessionRef.current
        if (cachedSession) {
          setScreen(resolveScreen(cachedSession))
          return
        }

        const restoredSession = await authApi.me()
        if (restoredSession) {
          dispatch(setSession(restoredSession))
          setScreen(resolveScreen(restoredSession))
        } else {
          dispatch(clearSession())
          setScreen('welcome')
        }
      } catch (error) {
        console.error('[app] Failed to bootstrap session', error)
        dispatch(clearSession())
        setScreen('welcome')
      } finally {
        setIsBootstrapping(false)
      }
    }, SPLASH_DURATION_MS)

    return () => clearTimeout(timer)
  }, [dispatch, resolveScreen])

  const handleAuthSuccess = useCallback(
    (nextSession: AuthSession) => {
      dispatch(setSession(nextSession))
      setScreen(resolveScreen(nextSession))
    },
    [dispatch, resolveScreen],
  )

  const startAuthFlow = useCallback((mode: 'login' | 'register') => {
    setAuthMode(mode)
    setScreen('auth')
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('[app] Failed to logout', error)
    } finally {
      dispatch(clearSession())
      setScreen('welcome')
    }
  }, [dispatch])

  return {
    screen,
    session,
    isBootstrapping,
    setScreen,
    bootstrap,
    handleAuthSuccess,
    handleLogout,
    authMode,
    startAuthFlow,
  }
}

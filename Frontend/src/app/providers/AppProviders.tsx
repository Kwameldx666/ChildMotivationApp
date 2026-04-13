"use client"

import { type ReactNode, useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { CssVarsProvider } from '@mui/joy/styles'
import * as signalR from '@microsoft/signalr'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/i18n/provider'
import { appStore, persistor } from '@/store/appStore'
import { theme } from '@/theme'
import AiChatWidget from '@/components/ai-chat-widget'
import { useSubscriptionGate } from '@/hooks/use-subscription-gate'
import { useAppSelector } from '@/store/hooks'
import { selectAuthSession } from '@/features/auth/store/authSlice'

interface AppProvidersProps {
  children: ReactNode
}

function PresenceConnectionBridge() {
  const session = useAppSelector(selectAuthSession)
  const userId = session?.user.id?.trim()

  useEffect(() => {
    if (!userId) return

    const signalRUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://161.35.169.189:8090'
    const hubUrl = `${signalRUrl}/hubs/notifications?userId=${encodeURIComponent(userId)}`

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    let disposed = false

    const connect = async () => {
      try {
        await connection.start()
      } catch {
        if (!disposed) {
          setTimeout(() => {
            void connect()
          }, 5000)
        }
      }
    }

    void connect()

    return () => {
      disposed = true
      void connection.stop()
    }
  }, [userId])

  return null
}

function AiWidgetMount() {
  const session = useAppSelector(selectAuthSession)
  const { hasFeature, isLoading } = useSubscriptionGate()

  if (!session) return null

  const role = session.profile.role?.toLowerCase()
  const isChild = role === 'child'

  // Children always get the floating AI widget as requested.
  if (isChild) return <AiChatWidget />

  if (isLoading) return null
  if (!hasFeature('aiAssistant')) return null

  return <AiChatWidget />
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  )

  return (
    <Provider store={appStore}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <CssVarsProvider theme={theme} defaultMode="light">
                {children}
                <PresenceConnectionBridge />
                <AiWidgetMount />
                <Toaster position="top-right" richColors closeButton duration={4000} />
                {process.env.NODE_ENV !== 'production' ? (
                  <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
                ) : null}
              </CssVarsProvider>
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  )
}

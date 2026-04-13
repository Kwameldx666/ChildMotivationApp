"use client"

import { type ReactNode, useState } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { CssVarsProvider } from '@mui/joy/styles'
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

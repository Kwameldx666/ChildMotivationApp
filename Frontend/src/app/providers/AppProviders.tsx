"use client"

import { type ReactNode, useState } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { CssVarsProvider } from '@mui/joy/styles'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { appStore, persistor } from '@/store/appStore'
import { theme } from '@/theme'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CssVarsProvider theme={theme} defaultMode="light">
              {children}
              <Toaster position="top-right" richColors closeButton duration={4000} />
              {process.env.NODE_ENV !== 'production' ? (
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
              ) : null}
            </CssVarsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  )
}

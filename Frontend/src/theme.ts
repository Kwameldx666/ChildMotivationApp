import { extendTheme } from '@mui/joy/styles'

export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: '#6366f1',
          solidHoverBg: '#4f46e5',
        },
        neutral: {
          solidBg: '#0f172a',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          solidBg: '#a855f7',
          solidHoverBg: '#9333ea',
        },
      },
    },
  },
  fontFamily: {
    display: '"Space Grotesk", var(--font-geist, sans-serif)',
    body: 'var(--font-geist, sans-serif)',
  },
})

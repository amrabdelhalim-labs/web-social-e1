'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { prefixer } from 'stylis';
import rtlPlugin from '@mui/stylis-plugin-rtl';

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'var(--font-cairo), "Roboto", sans-serif',
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

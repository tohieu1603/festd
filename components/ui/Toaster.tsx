'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useThemeStore } from '@/stores/theme.store';

export function Toaster() {
  const { theme } = useThemeStore();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        style: {
          background: theme === 'dark' ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
          color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
          border: `1px solid ${theme === 'dark' ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 5.9% 90%)'}`,
        },
      }}
    />
  );
}

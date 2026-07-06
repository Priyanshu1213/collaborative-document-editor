'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Global toast host. Mounted once in the root layout so every `toast.*`
 * call across the app renders. Styled with the design-system tokens so it
 * adapts automatically to light / dark themes.
 */
export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--popover)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '14px',
          lineHeight: '1.4',
          padding: '10px 14px',
          maxWidth: '440px',
        },
        success: {
          iconTheme: { primary: 'var(--primary)', secondary: 'var(--popover)' },
        },
        error: {
          duration: 5000,
          iconTheme: { primary: 'var(--destructive)', secondary: 'var(--popover)' },
        },
        loading: {
          iconTheme: { primary: 'var(--primary)', secondary: 'var(--muted)' },
        },
      }}
    />
  );
}

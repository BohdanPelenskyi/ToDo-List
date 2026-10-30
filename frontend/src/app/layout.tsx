import '@fontsource-variable/manrope';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TODO',
  description: 'Task management application',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the layout use the full screen and respect notches via env(safe-area-inset-*).
  viewportFit: 'cover',
  themeColor: '#0f766e',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-mist font-sans text-ink antialiased">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

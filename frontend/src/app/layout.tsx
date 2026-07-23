import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { AlertProvider } from '../context/AlertContext';

export const metadata: Metadata = {
  title: 'Harvest Hill Delivery',
  description: 'Mock-only Harvest Hill delivery portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}


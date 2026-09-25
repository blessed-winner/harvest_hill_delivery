import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { AlertProvider } from '../context/AlertContext';

export const metadata: Metadata = {
  title: 'Harvest Hill Delivery',
  description: 'Get your fresh produce with Harvest Hill Delivery',
  openGraph: {
    title: 'Harvest Hill Delivery',
    description: 'Get your fresh produce with Harvest Hill Delivery',
    siteName: 'Harvest Hill Delivery',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harvest Hill Delivery',
    description: 'Get your fresh produce with Harvest Hill Delivery',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}


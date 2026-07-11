import type { Metadata } from 'next';
// @ts-ignore: side-effect import of CSS file without declarations
import './globals.css';

export const metadata: Metadata = {
  title: 'Harvest Hill Delivery - Admin',
  description: 'Admin Portal for Harvest Hill Delivery System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

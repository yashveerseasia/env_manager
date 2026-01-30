import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ENV Configuration Manager',
  description: 'Secure environment variable and secrets management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


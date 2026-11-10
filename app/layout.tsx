import type { Metadata, Viewport } from 'next';
import '../src/styles.css';
import '../src/functional.css';
import '../src/console.css';

export const metadata: Metadata = {
  title: 'Loop Music — Artist Portal',
  description: 'Manage your music releases, royalties, payments, and distribution with Loop Music.',
  icons: null,
};

export const viewport: Viewport = {
  themeColor: '#f6f5f1',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

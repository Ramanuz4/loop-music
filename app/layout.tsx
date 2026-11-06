import type { Metadata, Viewport } from 'next';
import '../src/styles.css';
import '../src/functional.css';

export const metadata: Metadata = {
  title: 'Loop — Find your next sound',
  description: 'Find your next sound on Loop — a home for independent music makers.',
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

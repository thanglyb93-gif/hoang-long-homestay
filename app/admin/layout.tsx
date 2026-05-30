import type { ReactNode } from 'react';
import '../globals.css';

export const metadata = {
  title: 'Pricing Admin — Hoang Long Homestay',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* JetBrains Mono for price numerals */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          .price-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace; }
        `}</style>
      </head>
      <body className="antialiased bg-[#0b1120] min-h-screen">{children}</body>
    </html>
  );
}

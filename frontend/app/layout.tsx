import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Real-Time Tic-Tac-Toe',
  description: 'Multiplayer game powered by Nakama and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased bg-gray-900 text-white selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

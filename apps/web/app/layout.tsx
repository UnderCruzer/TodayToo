import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '今日もね / 오늘도요',
  description: 'Senior care app — AI daily check-in & memoir',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800 antialiased">{children}</body>
    </html>
  );
}

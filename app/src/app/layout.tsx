import './globals.css';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'TravelZ',
  description: 'Discover hotels around the world and find those with 18+ check-in policies.'
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
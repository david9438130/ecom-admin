import type { Metadata } from 'next';
import { Playfair_Display, Outfit } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aura Atelier | Suite de Administración & Control de Stock',
  description: 'Plataforma administrativa de inventario, pedidos asistidos y gestión de perfumería de alta gama.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${outfit.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#f4f4f6]">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sorteo",
  description: "Aplicación de sorteo con Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.className} h-full antialiased bg-black`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-black via-gray-900 to-red-900">
        {children}
      </body>
    </html>
  );
}

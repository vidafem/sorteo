import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const font = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supersorteo",
  description: "Landing page de Supersorteo con diseño moderno para sorteos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${font.className} h-full antialiased tracking-tight`}
    >
      <body className="min-h-full flex flex-col bg-[#fff7fb] text-slate-900">
        {children}
      </body>
    </html>
  );
}

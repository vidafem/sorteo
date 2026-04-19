import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased tracking-tight"
    >
      <body className="min-h-full flex flex-col bg-[#fff7fb] text-slate-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

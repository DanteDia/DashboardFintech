import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Cables 2026",
  description: "Sistema de cartera y operaciones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Sidebar />
        <main className="lg:pl-60 min-h-screen">
          <div className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
        </main>
      </body>
    </html>
  );
}

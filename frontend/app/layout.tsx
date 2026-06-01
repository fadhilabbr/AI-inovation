import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import AppShell from "./components/AppShell";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "EcoCraft — Solusi Daur Ulang Cerdas",
  description: "Platform cerdas berbasis AI untuk mengelola dan mendaur ulang sampah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

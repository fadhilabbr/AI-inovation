import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
  title: "SmartBin — Sistem Persampahan Cerdas",
  description: "Platform manajemen persampahan cerdas berbasis IoT untuk kota yang lebih bersih.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

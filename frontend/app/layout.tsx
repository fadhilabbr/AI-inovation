import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SmartBin Executive",
  description: "Dashboard for SmartBin Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              SmartBin
            </div>
            
            <nav className="sidebar-nav">
              <Link href="/" className="nav-item">
                📊 Dashboard
              </Link>
              <Link href="/bins" className="nav-item">
                🗑️ Bins Management
              </Link>
              <Link href="/users" className="nav-item">
                👥 Gamification
              </Link>
            </nav>
            
            <div style={{ marginTop: "auto", padding: "16px", background: "rgba(255,255,255,0.5)", borderRadius: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>System Status: 🟢 Online</p>
            </div>
          </aside>
          
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

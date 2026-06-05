import type { Metadata } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";

export const metadata: Metadata = {
  title: "AI Marketing Hub — Multi-Channel Creative Studio",
  description: "AI-powered marketing platform. Generate image variations, craft platform-specific captions, and publish everywhere with one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, overflowX: 'hidden' }}>
        <Starfield />
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1, pointerEvents: 'none' }} />
        <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

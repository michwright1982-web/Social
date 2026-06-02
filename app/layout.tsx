import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {children}
      </body>
    </html>
  );
}

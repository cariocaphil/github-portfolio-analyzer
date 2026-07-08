import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Portfolio Analyzer",
  description:
    "Generate an evidence-based Engineering Evidence Report from a public GitHub portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="motion-safe:scroll-smooth">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

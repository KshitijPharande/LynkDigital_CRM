import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LynkDigital CRM - Agency Operations Hub",
  description: "Internal CRM & Team Management System for LynkDigital Agency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-gray-100 min-h-screen antialiased selection:bg-brand-500/30 selection:text-brand-200">
        {children}
      </body>
    </html>
  );
}

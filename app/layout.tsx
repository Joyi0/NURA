import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NURA Jewelry",
  description: "Soft luxury jewelry for modern femininity."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

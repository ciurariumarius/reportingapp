import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigitalDot Reports",
  description: "Client-facing hybrid marketing reporting dashboard."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}

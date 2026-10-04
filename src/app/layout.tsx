import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPALE Study Tracker | A gentler way to prepare",
  description: "A free, personal study roadmap and practice space for the Philippine CPA licensure examination.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

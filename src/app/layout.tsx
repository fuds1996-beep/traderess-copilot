import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Traderess Copilot",
    template: "%s | Traderess Copilot",
  },
  description: "Your AI-powered trading companion",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://traderess.vercel.app",
  ),
  openGraph: {
    title: "Traderess Copilot",
    description: "Your AI-powered trading companion",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-950 text-white">{children}</body>
    </html>
  );
}

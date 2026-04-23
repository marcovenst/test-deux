import type { Metadata } from "next";
import { GoogleAdsScript } from "@/components/ads/GoogleAdsScript";
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
  title: "Zen Rezo A | Sakap pase jodi a",
  description:
    "Zen Rezo A se tablo tandans ayisyen an: nouvèl cho, espò, videyo viral, ak sijè kominotè an kreyòl.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ht">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAdsScript />
        {children}
      </body>
    </html>
  );
}

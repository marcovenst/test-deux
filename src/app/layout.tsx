import type { Metadata, Viewport } from "next";
import { GoogleAdsScript } from "@/components/ads/GoogleAdsScript";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { Geist, Geist_Mono } from "next/font/google";

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  getSiteUrl,
  SEO_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function googleSiteVerification(): Record<string, string> | undefined {
  const token = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  if (!token) {
    return undefined;
  }
  return { google: token };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "news",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ht_HT",
    alternateLocale: ["fr_HT", "en_US"],
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Haitian news and trends`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/twitter-image"],
    site: process.env.NEXT_PUBLIC_TWITTER_SITE ?? undefined,
    creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR ?? undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ht">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebsiteJsonLd />
        <GoogleAdsScript />
        {children}
      </body>
    </html>
  );
}

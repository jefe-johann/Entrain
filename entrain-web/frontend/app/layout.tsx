import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Entrain - Meditation Track Generator",
  description: "Create personalized meditation tracks with binaural beats and spoken affirmations",
  metadataBase: new URL('https://www.entrain.app'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    title: "Entrain - Meditation Track Generator",
    description: "Create personalized meditation tracks with binaural beats and spoken affirmations",
    url: "https://www.entrain.app",
    siteName: "Entrain",
    images: [
      {
        url: "/entrain-share.png",
        width: 480,
        height: 359,
        alt: "Entrain share preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Entrain - Meditation Track Generator",
    description: "Create personalized meditation tracks with binaural beats and spoken affirmations",
    images: ["/entrain-share.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

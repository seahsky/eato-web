import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TRPCProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";

const sfProText = localFont({
  src: [
    { path: "../../public/fonts/SF-Pro-Text-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Text-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Text-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Text-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-sf-text",
  display: "swap",
});

const sfProDisplay = localFont({
  src: [
    { path: "../../public/fonts/SF-Pro-Display-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Display-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Display-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Display-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-sf-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eato - Track Your Diet Together",
  description: "Track your daily calories and reach your health goals with your partner",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eato",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#C67B5C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${sfProText.variable} ${sfProDisplay.variable}`}>
        <head>
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </head>
        <body className="antialiased min-h-screen bg-background">
          <TRPCProvider>
            {children}
            <Toaster position="top-center" richColors />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

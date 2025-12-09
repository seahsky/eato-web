import type { Metadata, Viewport } from "next";
import { Nunito, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TRPCProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
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
      <html lang="en" className={`${nunito.variable} ${fraunces.variable}`}>
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

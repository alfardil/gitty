import type { Metadata } from "next";
import { Sen } from "next/font/google";

import "./globals.css";
import { Toaster } from "../components/ui/neo/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import React from "react";
import ReactQueryProvider from "@/lib/queryProvider";

const sen = Sen({
  variable: "--font-sen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Thestral",
  description:
    "This is Thestral, a web app that takes any public GitHub repository and converts it into an educational shortform video that onboards the user to the project's system design, tech stack, and other relevant information for onboarding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sen.className}>
      <head>
        <link rel="icon" type="image/png" href="/LexorLogoChange.png" />
        <link rel="shortcut icon" href="/LexorLogoChange.png" />
        <link rel="apple-touch-icon" href="/LexorLogoChange.png" />
      </head>
      <body className="bg-background text-foreground">
        <ReactQueryProvider>
          <Toaster />
          {children}
          <Analytics />
          <SpeedInsights />
        </ReactQueryProvider>
      </body>
    </html>
  );
}

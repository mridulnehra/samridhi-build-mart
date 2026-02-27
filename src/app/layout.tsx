import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Smridhi BuildMart",
  description: "Your Trusted Interlock Partner - Factory Management Made Simple",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smridhi BuildMart",
  },
};

export const viewport: Viewport = {
  themeColor: "#CD5C5C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

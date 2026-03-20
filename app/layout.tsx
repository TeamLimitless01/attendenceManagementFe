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
  title: "AMS - Attendance Management System",
  description: "A premium solution for modern attendance tracking with AI face recognition.",
};

import { Providers } from "@/lib/providers/Providers";
import SmoothScroll from "@/context/SmoothScroll";
import ChatWidget from "@/components/ChatWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SmoothScroll>
          <Providers>
            {children}
            <ChatWidget />
          </Providers>
        </SmoothScroll>
      </body>
    </html>
  );
}

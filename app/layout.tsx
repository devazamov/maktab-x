import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Baloo 2 carries the "friendly cartoon" personality for headings and
// numbers (XP, level); Inter stays plain and legible for body copy —
// a deliberate two-family split per the brief's "premium cartoon 3D,
// friendly, but professional startup" direction (section 4/section 6
// of the design brief).
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MAKTAB X",
  description: "Bilim. Musobaqa. Rivojlanish.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`${baloo.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {/* Telegram Mini App SDK — must load before any hook reads window.Telegram */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}

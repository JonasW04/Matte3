import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Matte 3 | TMA4422",
  description: "Øv på gamle NTNU-eksamensoppgaver for TMA4422 Matematikk 3C."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" className={`${manrope.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DESIGN.MD Generator",
  description: "Convert any Figma file, screenshot, or website into a production-ready DESIGN.md file instantly.",
};

export interface RootLayoutProps {
  children: ReactNode;
}

/** Defines the root application layout. */
export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-gray-950 font-sans text-gray-100 antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  );
}

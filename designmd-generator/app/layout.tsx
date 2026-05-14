import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignMD Generator",
  description: "Generate DESIGN.md files from Figma links, images, and website URLs.",
};

export interface RootLayoutProps {
  children: ReactNode;
}

/** Defines the root application shell. */
export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

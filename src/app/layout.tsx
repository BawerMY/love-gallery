import type { Metadata, Viewport } from "next";
import { t } from "@/strings";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: t.common.galleryName,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={fontVariables}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noir Atelier | Alta joalheria em pedras negras",
  description:
    "Site de alta joalheria com estética editorial, pedras negras, prata escura e experiência premium.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    title: "Noir Atelier",
    description: "Alta joalheria em pedras negras com experiência editorial premium.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050403"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}

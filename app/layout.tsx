import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora Joias | Joias banhadas a ouro",
  description:
    "Loja elegante de joias banhadas a ouro com colares, anéis, pingentes, pulseiras, brincos, carrinho e Stripe Checkout.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    title: "Aurora Joias",
    description: "Joias banhadas a ouro com experiência premium.",
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

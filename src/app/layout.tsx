import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CarolSol Studio Premium - Megahair, Perucas e Tratamentos Capilares",
  description: "Há 14 anos transformando vidas com serviços acessíveis e atendimento humano. Megahair, perucas e tratamentos capilares com ética e amor.",
  keywords: ["Megahair", "Perucas", "Tratamentos Capilares", "CarolSol Studio", "Salão de Beleza", "Cabelo", "Beleza", "Autoestima"],
  authors: [{ name: "CarolSol Studio" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CarolSol Studio Premium",
    description: "Transforme sua autoestima com serviços capilares acessíveis e atendimento humano.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CarolSol Studio Premium",
    description: "Transforme sua autoestima com serviços capilares acessíveis e atendimento humano.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

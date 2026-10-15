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
  title: "Aline Lyra · Agendamento Online",
  description: "Agende seu horário com a Aline Lyra de forma rápida e simples.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f472b6'/%3E%3Cstop offset='100%25' stop-color='%23db2777'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M48 10l1.5 4.5L54 16l-4.5 1.5L48 22l-1.5-4.5L42 16l4.5-1.5z' fill='%23fdf2f8' opacity='0.9'/%3E%3Ctext x='32' y='44' font-family='Georgia, serif' font-size='30' font-weight='bold' fill='%23ffffff' text-anchor='middle'%3EAL%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AASS — Air Mauritius",
  description: "SSR-Airport Advanced Assisting System — AI-powered passenger assistance for SSR International Airport, Mauritius",
  icons: { icon: "/favicon.ico" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AASS" },
};

// Full-bleed viewport for iPhone notch and Android punch-hole
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

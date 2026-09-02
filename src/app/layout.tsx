import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./platform.css";
import "./parity.css";
import "./memory-cinema.css";
import "./memory-cinema-products.css";
import "./memory-cinema-ai.css";
import "./memory-cinema-finishing.css";
import "./memory-cinema-os.css";

export const metadata: Metadata = {
  title: "ThreadTales — Your chats, turned into a story",
  description: "Turn a private chat export into a beautiful friendship story. Your raw messages stay in your browser by default.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://threadtales.vercel.app"),
  openGraph: { title: "ThreadTales", description: "Your chats, turned into a story worth sharing.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./platform.css";

export const metadata: Metadata = {
  title: "ThreadTales — Your chats, turned into a story",
  description: "Turn a private chat export into a beautiful friendship story. Your raw messages stay in your browser.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://threadtales.vercel.app"),
  openGraph: {
    title: "ThreadTales",
    description: "Your chats, turned into a story.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

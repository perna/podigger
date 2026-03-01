import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Podigger - Podcast Aggregator",
  description: "A modern podcast aggregator built with Django and Next.js",
};

const MATERIAL_ICONS = [
  "account_circle",
  "add_circle",
  "arrow_forward_ios",
  "clear_all",
  "close",
  "cloud_download",
  "dark_mode",
  "delete",
  "delete_outline",
  "drag_indicator",
  "forward_30",
  "home",
  "info",
  "library_music",
  "light_mode",
  "link",
  "menu",
  "pause",
  "person",
  "play_arrow",
  "play_circle",
  "podcasts",
  "queue_music",
  "repeat",
  "replay_5",
  "replay_10",
  "rss_feed",
  "search",
  "search_insights",
  "settings",
  "shuffle",
  "sync",
  "trending_up",
  "tune",
  "verified",
  "volume_up",
].join(",");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={`${jakarta.variable} antialiased font-display`}>
        <ThemeProvider>
          <Navbar />
          <div className="min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
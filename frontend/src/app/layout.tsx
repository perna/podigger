import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional&icon_names=account_circle,add_circle,arrow_forward_ios,cloud_download,home,library_music,link,play_arrow,rss_feed,search,settings,sync"
        />
      </head>
      <body
        className={`${jakarta.variable} antialiased font-display`}
      >
        {children}
      </body>
    </html>
  );
}
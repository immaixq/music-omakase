import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIBE-ID — Your Music Has Been Keeping a Diary",
  description:
    "The personality test that doesn't ask you anything. It just checks your Spotify.",
  openGraph: {
    title:       "VIBE-ID — Your Music Has Been Keeping a Diary",
    description: "The personality test that doesn't ask you anything. It just checks your Spotify.",
    siteName:    "VIBE-ID",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "VIBE-ID",
    description: "Your music has been keeping a diary. We read it.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

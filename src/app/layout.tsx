import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ProjectProvider } from "@/context/ProjectContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SparkGen AI - AI Music Video & Animated Film Maker",
  description: "Create AI-powered music videos and animated short films. Generate lyrics, scripts, illustrations, animations, soundtracks, and narration — for any genre or style.",
  keywords: ["AI music video", "music video maker", "animated short film", "AI video generator", "Gemini", "Veo", "Lyria"],
  openGraph: {
    title: "SparkGen AI - AI Music Video & Film Maker",
    description: "Turn any idea into a music video or animated short film with AI. 11 music genres, 6 film styles, full pipeline from idea to final render.",
    type: "website",
    siteName: "SparkGen AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SparkGen AI - AI Music Video & Film Maker",
    description: "Create AI-powered music videos and animated short films. From idea to finished video in minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased bg-surface text-on-surface selection:bg-primary/20">
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  );
}

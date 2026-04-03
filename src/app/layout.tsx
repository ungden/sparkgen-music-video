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
  title: "SparkGen AI - Magic Music Video Maker",
  description: "AI-powered music video maker — generate lyrics, visuals, animations, and soundtracks for any genre",
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

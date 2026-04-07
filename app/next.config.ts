import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["p-limit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "generativelanguage.googleapis.com" },
    ],
  },
};

export default nextConfig;

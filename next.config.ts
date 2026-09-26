import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/today", permanent: false },
      { source: "/quiz", destination: "/practice", permanent: false },
      { source: "/quiz/play", destination: "/practice/play", permanent: false },
      { source: "/pot6", destination: "/practice", permanent: false },
      { source: "/mathcounts", destination: "/practice", permanent: false },
      { source: "/games", destination: "/practice", permanent: false },
    ];
  },
};

export default nextConfig;

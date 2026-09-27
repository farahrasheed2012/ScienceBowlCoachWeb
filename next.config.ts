import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  async redirects() {
    return [
      { source: "/", destination: "/quick", permanent: false },
      { source: "/quiz", destination: "/practice", permanent: false },
      { source: "/quiz/play", destination: "/practice/play", permanent: false },
      { source: "/learn/python", destination: "/python", permanent: false },
      { source: "/learn/python/:id", destination: "/python/:id", permanent: false },
      { source: "/pot6", destination: "/practice", permanent: false },
      { source: "/mathcounts", destination: "/practice", permanent: false },
      { source: "/games", destination: "/practice", permanent: false },
    ];
  },
};

export default nextConfig;

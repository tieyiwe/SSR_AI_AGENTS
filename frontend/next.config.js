/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow images from the backend API and Replit domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.ssr-ai.tiblogics.com" },
      { protocol: "https", hostname: "**.replit.app" },
      { protocol: "https", hostname: "**.repl.co" },
    ],
  },

  // Proxy /api/backend/* → FastAPI (avoids CORS issues from browser)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Required for standalone output in Replit/Docker
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

module.exports = nextConfig;

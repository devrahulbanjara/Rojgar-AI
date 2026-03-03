import type { NextConfig } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /**
   * Proxy all /api/* requests to the backend so client-side code can use
   * relative URLs (e.g. /api/auth/google) without worrying about CORS or
   * env variable availability in the browser.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

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

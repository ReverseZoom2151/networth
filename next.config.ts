import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static image optimization
  images: {
    unoptimized: true,
  },

  // For Capacitor mobile builds
  // Note: Next.js 15 with App Router and server components doesn't support full static export
  // We'll use the production build with Capacitor pointing to localhost or deployed URL
  // output: 'export', // Uncomment only if migrating to static generation

  // Webpack configuration
  webpack: (config) => {
    // Add any custom webpack config here
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your Next.js config options go here
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];
      externals.push("canvas");
      config.externals = externals;
    }
    // Prevent Webpack from trying to resolve optional 'canvas' dependency
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    } as any;
    return config;
  },
};

export default nextConfig;

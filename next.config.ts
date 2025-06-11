import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['express'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('handlebars');
    }
    return config;
  },
};

export default nextConfig;

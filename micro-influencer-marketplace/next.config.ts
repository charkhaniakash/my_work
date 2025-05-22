import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabling strict mode helps with the tab switching reload issue
  swcMinify: true,
  poweredByHeader: false,
};

export default nextConfig;



import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@org-code-ai/types'],
  output: 'standalone',
};

export default nextConfig;

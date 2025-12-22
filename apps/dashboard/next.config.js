const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ['@org-code-ai/types'],
  output: 'standalone',
  // Use webpack instead of Turbopack for better module resolution
  webpack: (config, { isServer }) => {
    // Add root node_modules to resolve paths for hoisted dependencies
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
      'node_modules',
    ];
    return config;
  },
};

module.exports = nextConfig;

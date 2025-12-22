/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ['@org-code-ai/types'],
  output: 'standalone',
};

module.exports = nextConfig;

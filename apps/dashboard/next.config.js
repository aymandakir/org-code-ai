/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ['@org-code-ai/types'],
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@tailwindcss/postcss', 'tw-animate-css'],
  },
};

module.exports = nextConfig;

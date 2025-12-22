/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Compiler to avoid babel-plugin-react-compiler dependency issue
  // reactCompiler: true,
  transpilePackages: ['@org-code-ai/types'],
  output: 'standalone',
};

module.exports = nextConfig;

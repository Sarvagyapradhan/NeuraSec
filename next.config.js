/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  // Use a custom environment variable instead of NODE_ENV
  env: {
    NEXT_PUBLIC_IS_DEVELOPMENT: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
};

module.exports = nextConfig; 
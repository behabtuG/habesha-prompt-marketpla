// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your config options here
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;

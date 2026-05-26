// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your config options here
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_APP_URL,
  },
  allowedDevOrigins: [
    "habeshaprompt.loca.lt",
    "rare-bobcats-mate.loca.lt",
    "tiny-needles-love.loca.lt",
    "bitter-berries-pick.loca.lt"
  ]
};

module.exports = nextConfig;

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com', // Google Drive direct links serve from here
        port: '', // usually empty
        pathname: '/uc**', // allow all paths
      },
    ],
  },
};

export default nextConfig;

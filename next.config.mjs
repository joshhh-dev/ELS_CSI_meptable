// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    distDir: ".next", // ensures Firebase Cloud Functions can find it

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

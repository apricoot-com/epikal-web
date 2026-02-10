import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https', // randomuser.me uses https
        hostname: 'randomuser.me',
      },
      ...(process.env.STORAGE_CLOUDFRONT_DOMAIN ? [{
        protocol: 'https' as const,
        hostname: process.env.STORAGE_CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, ''),
      }] : []),
    ],
  },
};

export default nextConfig;

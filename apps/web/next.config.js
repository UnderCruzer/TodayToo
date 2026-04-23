/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oneuldo/ai', '@oneuldo/db', '@oneuldo/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cnawnprwdcfmyswqolsu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // ESLint ve TypeScript hataları build'i durdurmayacak
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // TypeScript hataları hala kontrol edilecek
  },
}

module.exports = nextConfig


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
  // Vercel serverless function config - Puppeteer ve WebSocket için
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'ws', 'bufferutil', 'utf-8-validate'],
  },
}

module.exports = nextConfig

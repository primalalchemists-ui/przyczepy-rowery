import { withPayload } from '@payloadcms/next/withPayload'
import redirects from './redirects.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',

  images: {
    remotePatterns: [
      // ✅ Twoja domena (prod)
      {
        protocol: 'https',
        hostname: 'przyczepy-production.up.railway.app',
      },

      // ✅ localhost (dev)
      {
        protocol: 'http',
        hostname: 'localhost',
      },

      // ✅ Supabase Storage (public)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },

  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

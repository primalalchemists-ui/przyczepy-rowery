import { withPayload } from '@payloadcms/next/withPayload'
import redirects from './redirects.js'

const PUBLIC_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const publicHostname = new URL(PUBLIC_URL).hostname

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: publicHostname,
      },
      // opcjonalnie: jak w dev lecisz po http
      {
        protocol: 'http',
        hostname: publicHostname,
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      '@modelcontextprotocol/sdk',
      '@tavily/core',
      'cheerio',
    ],
  },
};

export default nextConfig;

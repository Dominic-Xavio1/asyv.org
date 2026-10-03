/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 🚀 Added: Optimizes project structure for cloud build workers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
  // Temporarily disabled React Compiler to fix hydration mismatch
  // reactCompiler: true,
  serverActions: {
    bodySizeLimit: "50mb",
  },
};

export default nextConfig;

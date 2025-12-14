/** @type {import('next').NextConfig} */
const nextConfig = {
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
};
/** @type {import('next').NextConfig} */
export default nextConfig;

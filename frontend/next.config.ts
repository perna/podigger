/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable telemetry in production
  ...(process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' && {
    telemetry: false,
  }),
};

export default nextConfig;

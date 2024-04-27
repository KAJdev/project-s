/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  redirects: async () => {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/files",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

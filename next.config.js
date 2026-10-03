/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/create', destination: '/tasks/new', permanent: false },
      { source: '/home', destination: '/tasks/radar', permanent: false },
      { source: '/explore', destination: '/tasks/radar', permanent: false },
      { source: '/doams/:id', destination: '/tasks/radar', permanent: false },
    ];
  },
};

module.exports = nextConfig;

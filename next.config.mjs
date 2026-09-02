/**
 * @type {import('next').NextConfig}
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:4000';

/**
 * Product and banner images are uploaded to the API host, and admins may also
 * paste an external URL - the backend treats that as a first-class case, not a
 * fallback. next/image needs every host declared up front, so an unknown host
 * would render nothing with only a build-time warning.
 *
 * Rather than allow-list the whole internet, next/image is used for our OWN
 * media host and a plain <img> is used for admin-pasted external URLs. The
 * component that renders media decides which, based on the URL.
 */
const mediaHost = (() => {
  try {
    const { protocol, hostname, port } = new URL(mediaUrl);
    return [{ protocol: protocol.replace(':', ''), hostname, port, pathname: '/uploads/**' }];
  } catch {
    return [];
  }
})();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: mediaHost,
    // Uploaded filenames are content-addressed UUIDs and never reused, so a
    // changed image is always a new URL and a long cache is safe.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_MEDIA_URL: mediaUrl,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // No camera, mic or geolocation is used anywhere on the storefront.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

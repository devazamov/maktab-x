/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Telegram opens the Mini App inside an iframe-like WebView — no
  // special config is needed for that, but we keep headers permissive
  // for the Telegram domains that embed us.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.web.telegram.org;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

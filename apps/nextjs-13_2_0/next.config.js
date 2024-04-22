const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    instrumentationHook: true,
  },
};

module.exports = withSentryConfig(nextConfig);

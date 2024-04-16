import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { instrumentationHook: true },
};

export default withSentryConfig(nextConfig);

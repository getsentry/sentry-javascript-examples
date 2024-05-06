import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    sentry({
      dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    }),
  ],
});

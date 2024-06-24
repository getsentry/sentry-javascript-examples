import * as Sentry from '@sentry/nuxt';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@sentry/nuxt'],

  runtimeConfig: {
    public: {
      sentry: {
        dsn: '' /* DSN */,
        debug: true,
      },
    },
  },
});

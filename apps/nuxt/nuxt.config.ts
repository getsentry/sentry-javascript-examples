// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@sentry/nuxt/module'],
  sentry:{
    debug: false,
    sourceMapsUploadOptions: {
      org: "org",
      project: "proj",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  },
  debug: false,
});

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config');
    // You can also import a `sentry.edge.config` file if you need to have a different configuration for Edge Functions
  }
}

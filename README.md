# Example Apps for the Sentry JS SDKs

_This repository is a work in progress_

The main purpose of this repository is to visualize the differences between the
[Sentry JS SDK](https://github.com/getsentry/sentry-javascript) version 7 and version 8. Those
example applications can also be used as a reference for using the JS SDKs.

## Setup

1. Clone the repository
1. Copy the `.env.example` file to `.env` and set the `SENTRY_DSN` variable in it

## How to test apps and save the payloads

1. Make sure you have a folder named like the app in `payload-files`.
   - Example: `apps/express` -> `payload-files/express`
1. Run `yarn start:[app]`, e.g. `yarn start:express`.
1. Check the "Disable Cache" option in the DevTools Network tab of your browser.
1. Open the following URLs in your browser.
1. The json file will be generated.

### Test URLs (for servers like express, fastify)

- http://localhost:3030/test-success
- http://localhost:3030/test-error
- http://localhost:3030/test-param-success/1337
- http://localhost:3030/test-param-error/1337
- http://localhost:3030/test-success-manual
- http://localhost:3030/test-error-manual
- http://localhost:3030/test-local-variables-caught
- http://localhost:3030/test-local-variables-uncaught

### Test URLs (for meta frameworks like Next.js)

- http://localhost:3000/test-route-handlers
  - click all the buttons to make requests

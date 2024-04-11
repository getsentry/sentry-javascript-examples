# Example Apps for the Sentry JS SDKs

_This repository is a work in progress_

The main purpose of this repository is to visualize the differences between the
[Sentry JS SDK](https://github.com/getsentry/sentry-javascript) version 7 and version 8. Those
example applications can also be used as a reference for using the JS SDKs.

## How to test apps and save the payloads

1. Change the `APP` variable of `utils/event-proxy-server/src/event-proxy-server.ts` to the app
   folder name you want to test.
   - Example: `apps/express` -> `APP = 'express'`
2. Make sure you have a folder named like the app in `utils/event-proxy-server/payload-files`.
   - Example: `apps/express` -> `utils/event-proxy-server/payload-files/express`
3. Run `yarn start:proxy-server`.
4. Run `yarn start:[app]` like `start:express`.
5. Check the "Disable Cache" option in the DevTools Network tab of your browser.
6. Open the following URLs in your browser.
7. The json file will be generated.

### Test URLs

- http://localhost:3030/test-success
- http://localhost:3030/test-error
- http://localhost:3030/test-param-success/1337
- http://localhost:3030/test-param-error/1337
- http://localhost:3030/test-success-manual
- http://localhost:3030/test-error-manual
- http://localhost:3030/test-local-variables-caught
- http://localhost:3030/test-local-variables-uncaught

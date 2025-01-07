import './style.css';
import { setupCounter } from './counter.js';
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,

  integrations: [Sentry.browserTracingIntegration(), Sentry.browserSessionIntegration()],

  release: 'my-project-name@1.0.0',

  beforeSendTransaction(event) {
    return event;
  },
  tracesSampleRate: 1.0,
  debug: true,
});

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
  </div>
`;

setupCounter(document.querySelector('#counter'));

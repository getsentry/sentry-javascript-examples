import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class AppService {
  testSuccess() {
    return { version: 'v1' };
  }

  async testError() {
    const exceptionId = Sentry.captureException(new Error('This is an error'));

    await Sentry.flush(2000);

    return { exceptionId };
  }

  testParamSuccess(param: string) {
    return { paramWas: param };
  }

  async testParamError(param: string) {
    const exceptionId = Sentry.captureException(new Error('This is an error'));

    await Sentry.flush(2000);

    return { exceptionId, paramWas: param };
  }

  async testSuccessManual() {
    Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
      Sentry.startSpan({ name: 'test-span' }, () => undefined);
    });

    await Sentry.flush();

    return 'test-success-body';
  }

  async testErrorManual() {
    Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
      Sentry.startSpan({ name: 'test-span' }, () => {
        Sentry.captureException(new Error('This is an error'));
      });
    });

    await Sentry.flush();

    return 'test-error-body';
  }

  testLocalVariablesUncaught() {
    const randomVariableToRecord = 'LOCAL_VARIABLE';
    throw new Error(
      `Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`,
    );
  }

  testLocalVariablesCaught() {
    const randomVariableToRecord = 'LOCAL_VARIABLE';

    let exceptionId: string;
    try {
      throw new Error('Local Variable Error');
    } catch (e) {
      exceptionId = Sentry.captureException(e);
    }

    return { exceptionId, randomVariableToRecord };
  }
}

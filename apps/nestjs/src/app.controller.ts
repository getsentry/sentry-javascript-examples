import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test-success')
  testSuccess() {
    return this.appService.testSuccess();
  }

  @Get('test-error')
  testError() {
    return this.appService.testError();
  }

  @Get('test-param-success/:param')
  testParamSuccess(@Param() param: string) {
    return this.appService.testParamSuccess(param);
  }

  @Get('test-param-error/:param')
  testParamError(@Param() param: string) {
    return this.appService.testParamError(param);
  }

  @Get('test-success-manual')
  testSuccessManual() {
    return this.appService.testSuccessManual();
  }

  @Get('test-error-manual')
  testErrorManual() {
    return this.appService.testErrorManual();
  }

  // unhandled exceptions do not send an event in v7 (just the transaction, if the error is handled with an exception filter)
  @Get('test-local-variables-uncaught')
  testLocalVariablesUncaught() {
    return this.appService.testLocalVariablesUncaught();
  }

  @Get('test-local-variables-caught')
  testLocalVariablesCaught() {
    return this.appService.testLocalVariablesCaught();
  }
}

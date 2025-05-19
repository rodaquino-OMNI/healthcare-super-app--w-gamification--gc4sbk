import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './middleware';

/**
 * Global module that provides error handling capabilities
 * to the entire application
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [],
})
export class ErrorsModule {}
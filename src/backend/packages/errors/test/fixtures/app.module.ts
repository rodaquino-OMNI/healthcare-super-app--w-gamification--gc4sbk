import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TestController } from './test.controller';
import { AllExceptionsFilter } from '../../../src/middleware';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

/**
 * Test application module for error handling e2e tests
 */
@Module({
  imports: [],
  controllers: [TestController],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (logger: LoggerService) => {
        return new AllExceptionsFilter(logger);
      },
      inject: [LoggerService]
    },
    {
      provide: 'TEST_SERVICE',
      useValue: {
        performOperation: () => 'test result',
        throwError: (errorType: string) => {
          throw new Error(`Test error: ${errorType}`);
        }
      }
    }
  ],
})
export class AppModule {}
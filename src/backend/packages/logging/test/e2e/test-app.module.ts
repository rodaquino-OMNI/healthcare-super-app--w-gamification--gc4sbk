import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../../src/logger.module';
import { TracingModule } from '@austa/tracing';
import { ErrorsModule } from '@austa/errors/nest';

/**
 * TestAppModule creates a minimal but realistic NestJS application for e2e testing
 * of the logging package. It configures the LoggerModule, TracingModule, and ErrorsModule
 * to simulate a production-like environment while allowing for customized testing scenarios.
 *
 * This module provides the foundation for all e2e tests of the logging package, ensuring
 * that tests run in an environment that closely resembles the actual application.
 */
@Module({
  imports: [
    // Configure environment variables for testing
    ConfigModule.forRoot({
      isGlobal: true,
      // Load environment-specific .env files for testing different scenarios
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'test'}.local`,
        `.env.${process.env.NODE_ENV || 'test'}`,
        '.env.test',
      ],
    }),

    // Configure the LoggerModule with test-specific settings
    LoggerModule.forRoot({
      // Default to 'debug' level for tests to capture all log entries
      level: process.env.LOG_LEVEL || 'debug',
      // Use 'text' formatter for better readability in test output
      formatter: process.env.LOG_FORMATTER || 'text',
      // Configure transports based on test environment
      transports: [
        {
          type: 'console',
          // Only colorize in non-CI environments
          colorize: process.env.CI !== 'true',
        },
        // Conditionally add file transport for test artifacts if enabled
        ...(process.env.LOG_TO_FILE === 'true'
          ? [
              {
                type: 'file',
                filename: 'test-logs/e2e-test.log',
                maxFiles: 3,
                maxSize: '10m',
              },
            ]
          : []),
      ],
      // Include service name for log context
      service: {
        name: 'logging-test-app',
        version: '1.0.0',
      },
      // Configure default context for all logs
      defaultContext: {
        environment: process.env.NODE_ENV || 'test',
        testing: true,
      },
    }),

    // Configure the TracingModule for distributed tracing in tests
    TracingModule.forRoot({
      enabled: process.env.TRACING_ENABLED === 'true',
      serviceName: 'logging-test-app',
      // Use exporter that's appropriate for the test environment
      exporter: process.env.TRACING_EXPORTER || 'console',
    }),

    // Configure the ErrorsModule for standardized error handling
    ErrorsModule.forRoot({
      // Enable detailed error responses in test environment
      detailedErrors: true,
      // Configure retry policies for testing transient errors
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class TestAppModule {}
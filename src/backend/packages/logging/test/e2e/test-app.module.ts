import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../../src/logger.module';
import { TracingModule } from '@austa/tracing';
import { ErrorsModule } from '@austa/errors/nest';
import { TestController } from './test.controller';
import { TestService } from './test.service';

/**
 * TestAppModule provides a minimal but realistic NestJS application for e2e testing
 * of the logging package. It configures the LoggerModule, TracingModule, and ErrorsModule
 * in a way that mimics a production environment, allowing for comprehensive integration
 * testing of logging functionality across different environments and scenarios.
 */
@Module({
  imports: [
    // Configure environment variables for testing
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      // Provide default configuration for testing
      load: [() => ({
        service: {
          name: 'logging-test-app',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'test',
        },
        logging: {
          level: process.env.LOG_LEVEL || 'debug',
          format: process.env.LOG_FORMAT || 'text',
          transports: ['console'],
          cloudwatch: {
            enabled: false,
            logGroup: 'austa-logging-test',
            logStream: 'e2e-tests',
          },
        },
        tracing: {
          enabled: true,
          exporter: 'console',
        },
      })],
    }),

    // Import LoggerModule with configuration
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get('logging.level'),
        format: configService.get('logging.format'),
        transports: configService.get('logging.transports'),
        defaultContext: {
          service: configService.get('service.name'),
          version: configService.get('service.version'),
          environment: configService.get('service.environment'),
        },
        cloudwatch: configService.get('logging.cloudwatch'),
      }),
    }),

    // Import TracingModule with configuration
    TracingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('tracing.enabled'),
        exporter: configService.get('tracing.exporter'),
        serviceName: configService.get('service.name'),
      }),
    }),

    // Import ErrorsModule with configuration
    ErrorsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Configure error handling for the test environment
        includeStacktrace: true,
        formatErrors: true,
        logErrors: true,
        environment: configService.get('service.environment'),
        defaultErrorMap: {
          validation: 400,
          business: 400,
          technical: 500,
          external: 502,
        },
      }),
    }),
  ],
  controllers: [TestController],
  providers: [TestService],
})
export class TestAppModule {}
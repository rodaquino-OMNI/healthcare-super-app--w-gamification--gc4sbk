import { NestFactory } from '@nestjs/core'; // @nestjs/core v10.3.0
import { AppModule } from './app.module';
import { notification } from './config/configuration';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { RetryService } from './retry/retry.service';
import { JourneyErrorInterceptor } from '@austa/errors/journey';

/**
 * Bootstrap the Notification Service application
 * Initializes NestJS with proper error handling, logging, tracing, and retry mechanisms
 */
async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);
  
  // Get configuration
  const config = notification();
  
  // Initialize structured logger
  const logger = new LoggerService('NotificationService');
  logger.setContext('Bootstrap');
  
  // Apply global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new JourneyErrorInterceptor());
  
  // Initialize tracing
  const tracingService = app.get(TracingService);
  tracingService.initialize('notification-service');
  
  // Initialize retry mechanism
  const retryService = app.get(RetryService);
  await retryService.initialize();
  
  // Start HTTP server
  await app.listen(config.port);
  
  // Log successful startup
  logger.log(`Notification service running on port: ${config.port}`, {
    port: config.port,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
}

bootstrap().catch(err => {
  console.error('Failed to start Notification service', err);
  process.exit(1);
});
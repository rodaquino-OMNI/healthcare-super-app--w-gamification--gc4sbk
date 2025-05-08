import { NestFactory } from '@nestjs/core'; // @nestjs/core v10.3.0+
import { AppModule } from './app.module';
import { notification } from './config/configuration';
import { LoggerService } from '@app/shared/logging/logger.service';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { RetryService } from './retry/retry.service';
import { ValidationPipe } from '@nestjs/common';
import { NotificationErrorInterceptor } from './notifications/interceptors/notification-error.interceptor';

/**
 * Bootstrap the Notification Service application.
 * 
 * Initializes the NestJS application with proper error handling, validation,
 * logging, tracing, and retry mechanisms. Configures global filters and
 * interceptors for consistent error handling across the service.
 */
async function bootstrap() {
  // Create NestJS application with logging
  const logger = new LoggerService('NotificationService');
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });
  
  // Get configuration
  const config = notification();
  
  // Initialize tracing
  const tracingService = app.get(TracingService);
  await tracingService.initialize('notification-service');
  
  // Initialize retry mechanism
  const retryService = app.get(RetryService);
  await retryService.initialize();
  logger.log('Retry mechanism initialized');
  
  // Apply global filters and pipes
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalInterceptors(new NotificationErrorInterceptor(logger));
  
  // Start the application
  await app.listen(config.port);
  logger.log(`Notification service running on port: ${config.port}`, {
    port: config.port,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  });
  
  // Log startup metrics
  logger.log('Notification service successfully started', {
    startupTime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
}

bootstrap().catch(error => {
  console.error('Failed to start notification service', error);
  process.exit(1);
});
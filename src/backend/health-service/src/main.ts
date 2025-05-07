import { NestFactory } from '@nestjs/core'; // NestJS Core 10.0.0+
import { AppModule } from './app.module';
import { health } from './config/configuration';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Import from @austa packages using TypeScript path aliases
import { TracingService } from '@austa/tracing';
import { 
  GlobalExceptionFilter, 
  RetryInterceptor, 
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  TimeoutInterceptor
} from '@austa/errors/nest';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';

// Import monitoring components
import { HealthCheckModule } from './monitoring';

/**
 * Initializes and starts the NestJS application.
 * Configures error handling, monitoring, tracing, and API documentation.
 */
async function bootstrap(): Promise<void> {
  // Create a NestJS application instance using AppModule
  const app = await NestFactory.create(AppModule, {
    // Enable shutdown hooks for graceful termination
    shutdownHooks: true,
    // Use structured logger for application logs
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get the configuration for the health service
  const config = health();
  
  // Get logger service for dependency injection
  const logger = app.get(LoggerService);
  logger.setContext('HealthService');
  
  // Get tracing service for OpenTelemetry integration
  const tracingService = app.get(TracingService);
  
  // Get Prisma service for database connection management
  const prismaService = app.get(PrismaService);
  
  // Enable graceful shutdown with Prisma
  prismaService.enableShutdownHooks(app);
  
  // Apply global validation pipe for input validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  
  // Apply the global exception filter with enhanced error handling
  app.useGlobalFilters(new GlobalExceptionFilter(logger, tracingService));
  
  // Apply global interceptors for retry and circuit breaker patterns
  app.useGlobalInterceptors(
    // Configure timeout handling for requests
    new TimeoutInterceptor({
      timeout: 30000, // 30 seconds
      logger,
    }),
    // Configure retry with exponential backoff for transient errors
    new RetryInterceptor({
      maxRetries: 3,
      retryStrategy: 'exponential',
      scalingFactor: 2,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      retryableErrors: ['TimeoutError', 'ConnectionError', 'ServiceUnavailableError'],
      logger,
    }),
    // Configure circuit breaker for external dependencies
    new CircuitBreakerInterceptor({
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      maxFailures: 3,
      logger,
    }),
    // Configure fallback strategies for graceful degradation
    new FallbackInterceptor({
      logger,
    })
  );

  // Set up Swagger documentation
  if (config.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AUSTA Health Service API')
      .setDescription('API for managing health data, devices, and insights')
      .setVersion('1.0')
      .addTag('health')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${config.apiPrefix}/docs`, app, document);
  }

  // Set the global prefix for the API endpoints
  app.setGlobalPrefix(config.apiPrefix);
  
  // Enable CORS for cross-origin requests
  app.enableCors();
  
  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();
  
  // Start the application, listening on the configured port
  await app.listen(config.port);
  
  logger.log(`Health Service is running on port ${config.port}`, 'Bootstrap');
  logger.log(`Swagger documentation available at /${config.apiPrefix}/docs`, 'Bootstrap');
  logger.log(`Health check endpoint available at /${config.apiPrefix}/health`, 'Bootstrap');
  logger.log(`Metrics endpoint available at /${config.apiPrefix}/metrics`, 'Bootstrap');

/**
 * Call the bootstrap function to start the application with error handling.
 * Provides proper error logging and process termination on bootstrap failure.
 * Integrates with OpenTelemetry for tracing the bootstrap process.
 */
bootstrap()
  .then(() => {
    const logger = new Logger('Bootstrap');
    logger.log('Health Service started successfully');
  })
  .catch(error => {
    const logger = new Logger('Bootstrap');
    logger.error(`Failed to start Health Service: ${error.message}`, error.stack);
    process.exit(1);
  });
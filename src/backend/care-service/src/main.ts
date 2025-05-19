import { NestFactory } from '@nestjs/core'; // v10.3.0+
import { ValidationPipe } from '@nestjs/common'; // v10.3.0+
import { ConfigService } from '@nestjs/config'; // v10.3.0+
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // v7.0.0+
import helmet from 'helmet'; // v7.0.0+
import compression from 'compression'; // v1.7.4+

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@austa/errors/nest';
import { LoggerService } from '@austa/logging';

/**
 * Bootstraps the NestJS application for the Care Service.
 * 
 * This is the entry point for the Care Service microservice, which handles:
 * - Appointment scheduling and management
 * - Provider search and selection
 * - Telemedicine sessions
 * - Medication management
 * - Treatment plans
 * - Symptom checking
 */
async function bootstrap(): Promise<void> {
  // Create a NestJS application instance with the AppModule and logger
  const logger = new LoggerService({ 
    service: 'care-service',
    journey: 'care',
    structured: true, // Enable structured JSON logging
    context: { // Add default context for all logs
      environment: process.env.NODE_ENV || 'development',
    }
  });
  
  const app = await NestFactory.create(AppModule, {
    logger,
    bufferLogs: true, // Buffer logs until logger is fully initialized
  });

  // Get the ConfigService to access configuration values
  const configService = app.get(ConfigService);

  // Set up global middleware (helmet, compression)
  app.use(helmet({
    // Content Security Policy configuration
    contentSecurityPolicy: configService.get<boolean>('security.csp.enabled') ? {
      directives: configService.get('security.csp.directives'),
    } : false,
    // XSS Protection
    xssFilter: true,
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options to prevent clickjacking
    frameguard: {
      action: 'deny',
    },
    // Referrer Policy for privacy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // X-Content-Type-Options to prevent MIME sniffing
    noSniff: true,
    // X-Download-Options for IE8+
    ieNoOpen: true,
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: true },
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })); // Adds security HTTP headers
  
  app.use(compression()); // Enables response compression

  // Configure CORS with appropriate settings
  app.enableCors({
    origin: configService.get<string[]>('apiGateway.cors.origin'),
    credentials: configService.get<boolean>('apiGateway.cors.credentials'),
    methods: configService.get<string[]>('apiGateway.cors.methods'),
    allowedHeaders: configService.get<string[]>('apiGateway.cors.allowedHeaders'),
    exposedHeaders: configService.get<string[]>('apiGateway.cors.exposedHeaders'),
    maxAge: configService.get<number>('apiGateway.cors.maxAge') || 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Apply global ValidationPipe for request validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip unwanted properties
    forbidNonWhitelisted: true, // Throw error on unwanted properties
    transform: true, // Transform payloads based on DTO types
    transformOptions: {
      enableImplicitConversion: false, // Require explicit type conversion
      exposeDefaultValues: true, // Expose default values from DTO classes
    },
    errorHttpStatusCode: 422, // Use 422 Unprocessable Entity for validation errors
    exceptionFactory: (errors) => {
      // Enhanced error messages with field paths and constraints
      const formattedErrors = errors.map(error => ({
        field: error.property,
        constraints: error.constraints,
        children: error.children,
      }));
      
      logger.debug(
        `Validation failed: ${JSON.stringify(formattedErrors)}`,
        'ValidationPipe'
      );
      
      // Let the GlobalExceptionFilter handle the final error formatting
      return { errors: formattedErrors, type: 'VALIDATION_ERROR' };
    },
  }));

  // Apply global GlobalExceptionFilter for error handling with journey context
  app.useGlobalFilters(new GlobalExceptionFilter(logger, {
    service: 'care-service',
    journey: 'care',
    includeStacktrace: configService.get<boolean>('app.debug') || false,
    fallbackMessages: {
      default: 'An unexpected error occurred in the Care service',
      validation: 'The provided data is invalid',
      notFound: 'The requested resource was not found',
      unauthorized: 'You are not authorized to access this resource',
      forbidden: 'You do not have permission to access this resource',
      badRequest: 'The request could not be processed',
      timeout: 'The request took too long to process',
      tooManyRequests: 'Too many requests, please try again later',
      serviceUnavailable: 'The Care service is temporarily unavailable',
    },
    // Configure retry policies for transient errors
    retryOptions: {
      maxRetries: configService.get<number>('error.retry.maxRetries') || 3,
      initialDelayMs: configService.get<number>('error.retry.initialDelayMs') || 100,
      maxDelayMs: configService.get<number>('error.retry.maxDelayMs') || 1000,
      backoffFactor: configService.get<number>('error.retry.backoffFactor') || 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  }));

  // Set up Swagger documentation with appropriate metadata
  const config = new DocumentBuilder()
    .setTitle('Care Service API')
    .setDescription('API documentation for the Care Service')
    .setVersion('1.0')
    .addTag('care')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Serve Swagger UI at /api

  // Get the port from configuration (default to 3000)
  const port = configService.get<number>('care.port') || 3000;

  // Start the HTTP server on the configured port
  await app.listen(port);

  // Log the application startup with the service URL
  logger.log(`Care Service running on ${configService.get<string>('care.baseUrl')}:${port}`, 'Bootstrap');
}

// Call the bootstrap function to start the application
bootstrap().catch(error => {
  // Log the error with proper formatting before exiting
  const logger = new LoggerService({ service: 'care-service', journey: 'care' });
  logger.error(
    'Failed to start Care Service', 
    error instanceof Error ? error.stack : String(error),
    'Bootstrap'
  );
  
  // Exit with error code
  process.exit(1);
});
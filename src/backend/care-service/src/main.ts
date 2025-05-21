import { NestFactory } from '@nestjs/core'; // v10.3.0+
import { ValidationPipe } from '@nestjs/common'; // v10.3.0+
import { ConfigService } from '@nestjs/config'; // v10.3.0+
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // v7.0.0+
import helmet from 'helmet'; // v7.0.0+
import compression from 'compression'; // v1.7.4+

import { AppModule } from './app.module';
import { 
  GlobalExceptionFilter, 
  RetryInterceptor, 
  CircuitBreakerInterceptor,
  TimeoutInterceptor
} from '@app/errors/nest';
import { LoggerService } from '@app/logging';

/**
 * Bootstraps the NestJS application for the Care Service.
 */
async function bootstrap(): Promise<void> {
  // Create a NestJS application instance with the AppModule
  const app = await NestFactory.create(AppModule, {
    // Enable structured logging from the start
    logger: new LoggerService({ context: 'CareService' })
  });

  // Get the ConfigService to access configuration values
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Set up global middleware (helmet, compression)
  app.use(helmet({
    // Enhanced security headers based on environment configuration
    contentSecurityPolicy: configService.get<boolean>('security.csp.enabled') ? {
      directives: configService.get('security.csp.directives')
    } : false,
    xssFilter: true,
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    }
  }));
  app.use(compression()); // Enables response compression

  // Configure CORS with appropriate settings from environment configuration
  app.enableCors({
    origin: configService.get<string | string[]>('apiGateway.cors.origin'),
    credentials: configService.get<boolean>('apiGateway.cors.credentials'),
    methods: configService.get<string[]>('apiGateway.cors.methods'),
    allowedHeaders: configService.get<string[]>('apiGateway.cors.allowedHeaders'),
    exposedHeaders: configService.get<string[]>('apiGateway.cors.exposedHeaders'),
    maxAge: configService.get<number>('apiGateway.cors.maxAge')
  });

  // Apply global ValidationPipe for request validation with enhanced error messages
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip unwanted properties
    forbidNonWhitelisted: true, // Throw error on unwanted properties
    transform: true, // Transform payloads based on DTO types
    transformOptions: { enableImplicitConversion: true },
    // Enhanced error messages with property path and validation constraints
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value
      }));
      
      logger.debug(
        `Validation failed: ${JSON.stringify(formattedErrors)}`,
        'ValidationPipe'
      );
      
      return {
        message: 'Validation failed',
        errors: formattedErrors
      };
    }
  }));

  // Apply global exception filter for standardized error handling
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  
  // Apply global interceptors for enhanced error handling
  app.useGlobalInterceptors(
    // Add timeout handling with configurable timeout duration
    new TimeoutInterceptor(configService.get<number>('care.timeoutMs') || 30000),
    // Add retry mechanism with exponential backoff for transient errors
    new RetryInterceptor(),
    // Add circuit breaker for external dependencies
    new CircuitBreakerInterceptor()
  );

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
  logger.log(
    `Care Service running on ${configService.get<string>('care.baseUrl')}:${port}`,
    'Bootstrap'
  );
}

// Call the bootstrap function to start the application
bootstrap();
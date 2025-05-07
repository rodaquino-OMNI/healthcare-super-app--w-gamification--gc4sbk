import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import app module using path alias
import { AppModule } from '@app/auth/app.module';

// Import shared services using path aliases
import { LoggerService } from '@austa/logging';
import { GlobalExceptionFilter } from '@austa/errors/nest';
import { TracingService } from '@austa/tracing';

/**
 * Bootstrap function to initialize and configure the NestJS application
 * for the Auth Service in the AUSTA SuperApp.
 */
async function bootstrap() {
  try {
    // Create a NestJS application instance using NestFactory.create with AppModule
    const app = await NestFactory.create(AppModule, {
      // Disable default logger during startup to prevent duplicate logs
      logger: false,
    });

    // Set up the enhanced LoggerService as the application logger
    const logger = app.get(LoggerService);
    app.useLogger(logger);
    
    // Get the TracingService for request tracing
    const tracingService = app.get(TracingService);
    
    // Get the ConfigService to access configuration values
    const configService = app.get(ConfigService);
    
    // Retrieve the server port from configuration with fallback
    const port = configService.get<number>('authService.server.port', 3001);
    
    // Apply global exception filter using enhanced GlobalExceptionFilter
    // This provides standardized error responses and integrates with tracing
    app.useGlobalFilters(new GlobalExceptionFilter(logger, tracingService));
    
    // Configure CORS settings based on allowed origins from configuration
    const corsOrigins = configService.get<string[]>('authService.cors.allowedOrigins', [
      "https://app.austa.com.br",
      /\.austa\.com\.br$/
    ]);
    
    app.enableCors({
      origin: corsOrigins,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    });
    
    // Set up global validation pipe with options for stripping unknown properties,
    // transforming inputs, and detailed error messages
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        // Disable exposing validation error target for security
        validationError: {
          target: false,
          value: true,
        },
      }),
    );
    
    // Set global prefix for all routes (e.g., '/api/auth')
    const apiPrefix = configService.get<string>('authService.server.apiPrefix', 'api/auth');
    app.setGlobalPrefix(apiPrefix);
    
    // Start the application listening on the configured port
    await app.listen(port);
    
    // Log the application start with the port information
    logger.log(`Auth Service started successfully on port ${port}`, 'Bootstrap', {
      service: 'auth-service',
      port,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    // Handle bootstrap errors with proper logging and exit
    console.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

// Call the bootstrap function
bootstrap();
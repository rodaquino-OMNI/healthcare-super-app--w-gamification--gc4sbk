import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import axios from 'axios';
import { createSecureAxios } from '@app/utils/http';
import { LoggerService } from '@app/logging';
import { TracingService } from '@app/tracing';
import { AppModule } from './app.module';
import { KafkaConsumerService } from './events/kafka/kafka.consumer';
import { DEFAULT_PORT } from './config/validation.schema';
import { BaseError, AllExceptionsFilter } from '@app/errors';
import { PrismaService } from './database/prisma.service';
import { GamificationEvent } from '@app/interfaces/gamification';

/**
 * Configure Swagger documentation for the API
 * @param app NestJS application instance
 * @param logger Logger service for logging configuration steps
 */
function setupSwagger(app: INestApplication, logger: LoggerService): void {
  try {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gamification Engine API')
      .setDescription('API documentation for the AUSTA SuperApp Gamification Engine')
      .setVersion('1.0')
      .addTag('gamification', 'Core gamification functionality')
      .addTag('achievements', 'Achievement management and unlocking')
      .addTag('rewards', 'Reward management and distribution')
      .addTag('quests', 'Quest management and progression')
      .addTag('profiles', 'User game profile management')
      .addTag('leaderboard', 'Leaderboard generation and ranking')
      .addTag('events', 'Event processing and rule evaluation')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [GamificationEvent],
      deepScanRoutes: true,
    });
    
    SwaggerModule.setup('api/docs', app, document, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });
    
    logger.log('Configured Swagger API documentation at /api/docs', 'Bootstrap');
  } catch (error) {
    logger.error(
      `Failed to configure Swagger: ${error.message}`,
      error.stack,
      'Bootstrap',
    );
    // Continue bootstrap process even if Swagger fails
  }
}

/**
 * Bootstrap the NestJS application with enhanced error handling,
 * structured logging, and proper configuration.
 */
async function bootstrap() {
  let logger: LoggerService | null = null;
  
  try {
    // Create the NestJS application with the AppModule
    const app = await NestFactory.create(AppModule, {
      // Disable default logger as we'll use our custom LoggerService
      logger: false,
      // Automatically close the application when the process is terminated
      abortOnError: false,
    });

    // Get the ConfigService for environment configuration
    const configService = app.get(ConfigService);
    
    // Get the LoggerService for structured logging
    logger = app.get(LoggerService);
    app.useLogger(logger);

    // Get the TracingService for distributed tracing
    const tracingService = app.get(TracingService);

    // Create a root span for the bootstrap process
    const bootstrapSpan = tracingService.startSpan('bootstrap');

    // Log application bootstrap start
    logger.log('Starting Gamification Engine service bootstrap', 'Bootstrap');

    // Apply security headers with Helmet
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    logger.log('Applied Helmet security middleware', 'Bootstrap');

    // Configure secure Axios HTTP client to prevent SSRF attacks
    axios.defaults.adapter = createSecureAxios({
      allowedHosts: configService.get<string[]>('gamificationEngine.allowedHosts', []),
      timeout: configService.get<number>('gamificationEngine.httpTimeout', 30000),
    });
    logger.log('Configured secure Axios HTTP client', 'Bootstrap');

    // Enable CORS for cross-origin requests
    app.enableCors({
      origin: configService.get<string | string[]>('gamificationEngine.corsOrigins', '*'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    });
    logger.log('Enabled CORS for cross-origin requests', 'Bootstrap');

    // Register global exception filter for consistent error responses
    const globalExceptionsFilter = new AllExceptionsFilter(logger);
    app.useGlobalFilters(globalExceptionsFilter);
    logger.log('Registered global exception filter', 'Bootstrap');

    // Set up global validation pipe for request data validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties not defined in DTOs
        forbidNonWhitelisted: true, // Throw errors for non-whitelisted properties
        transform: true, // Transform payloads to DTO instances
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed error messages in production
        exceptionFactory: (errors) => {
          // Create a structured validation error with context
          return new BaseError({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.map((error) => ({
              property: error.property,
              constraints: error.constraints,
              value: error.value,
            })),
            context: { source: 'ValidationPipe' },
          });
        },
      }),
    );
    logger.log('Configured global validation pipe', 'Bootstrap');

    // Enable API versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    logger.log('Enabled API versioning', 'Bootstrap');

    // Set up Swagger documentation
    setupSwagger(app, logger);

    // Set up global prefix if configured
    const apiPrefix = configService.get<string>('gamificationEngine.apiPrefix');
    if (apiPrefix) {
      app.setGlobalPrefix(apiPrefix);
      logger.log(`Set global API prefix: ${apiPrefix}`, 'Bootstrap');
    }

    // Enable shutdown hooks for graceful termination
    app.enableShutdownHooks();
    logger.log('Enabled shutdown hooks for graceful termination', 'Bootstrap');

    // Ensure Prisma connection is properly closed on application shutdown
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutdownHooks(app);
    logger.log('Configured Prisma shutdown hooks', 'Bootstrap');

    // Initialize Kafka consumers if available
    try {
      const kafkaConsumer = app.get(KafkaConsumerService, { strict: false });
      if (kafkaConsumer) {
        logger.log('Initializing Kafka consumers', 'Bootstrap');
        await kafkaConsumer.onModuleInit();
        logger.log('Kafka consumers initialized successfully', 'Bootstrap');
      }
    } catch (error) {
      logger.warn(
        `Failed to initialize Kafka consumers: ${error.message}`,
        error.stack,
        'Bootstrap',
      );
      // Add error details to the bootstrap span
      bootstrapSpan.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.component': 'kafka',
      });
    }

    // Get the port from configuration or use default
    const port = configService.get<number>('gamificationEngine.port', DEFAULT_PORT);
    const nodeEnv = configService.get<string>('gamificationEngine.nodeEnv', 'development');

    // Start the HTTP server
    await app.listen(port);
    
    // Add successful bootstrap details to the span
    bootstrapSpan.setAttributes({
      'service.port': port,
      'service.environment': nodeEnv,
      'service.name': 'gamification-engine',
    });
    bootstrapSpan.end();
    
    logger.log(
      `Gamification Engine service started successfully on port ${port} in ${nodeEnv} mode`,
      'Bootstrap',
    );
  } catch (error) {
    // Handle bootstrap errors
    if (logger) {
      logger.error(
        `Failed to bootstrap Gamification Engine service: ${error.message}`,
        error.stack,
        'Bootstrap',
      );
    } else {
      console.error('Failed to bootstrap Gamification Engine service:');
      console.error(error);
    }
    
    // Exit with error code
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

// Start the application
bootstrap();
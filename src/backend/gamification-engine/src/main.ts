import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { KafkaConsumerService } from './events/kafka/kafka.consumer';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { GamificationExceptionFilter } from './common/exceptions/exception.filter';
import axios from 'axios';
import { createSecureAxios } from '@app/shared/utils/secure-axios';
import helmet from 'helmet';
import { DEFAULT_PORT } from './common/config/constants';

/**
 * Initializes and starts the NestJS application, configures the Kafka consumer,
 * sets up global exception handling, validation, and API documentation.
 */
async function bootstrap(): Promise<void> {
  try {
    // Create a NestJS application instance with a custom logger
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true, // Buffer logs until custom logger is set up
    });

    // Get the ConfigService from the application context
    const configService = app.get(ConfigService);
    
    // Get the LoggerService from the application context
    const loggerService = app.get(LoggerService);
    
    // Get the TracingService from the application context
    const tracingService = app.get(TracingService);
    
    // Set the custom logger as the application logger
    app.useLogger(loggerService);
    
    // Register the global exception filter
    const exceptionFilter = new GamificationExceptionFilter(
      loggerService,
      tracingService,
      configService
    );
    app.useGlobalFilters(exceptionFilter);
    
    // Log application bootstrap start
    loggerService.log('Starting Gamification Engine service', 'Bootstrap');
    
    // Get environment configuration
    const nodeEnv = configService.get<string>('gamificationEngine.nodeEnv', 'development');
    const port = configService.get<number>('gamificationEngine.port', DEFAULT_PORT);
    const apiPrefix = configService.get<string>('gamificationEngine.apiPrefix', 'api');
    
    // Log environment configuration
    loggerService.log(`Environment: ${nodeEnv}`, 'Bootstrap');
    loggerService.log(`Port: ${port}`, 'Bootstrap');
    loggerService.log(`API Prefix: ${apiPrefix}`, 'Bootstrap');
    
    // Configure security middleware
    app.use(helmet());
    loggerService.log('Security middleware configured', 'Bootstrap');
    
    // Set global API prefix
    app.setGlobalPrefix(apiPrefix);
    
    // Enable CORS
    app.enableCors();
    loggerService.log('CORS enabled', 'Bootstrap');
    
    // Replace the global Axios instance with our secure version
    // This provides additional protection against SSRF vulnerabilities
    axios.defaults.adapter = createSecureAxios().defaults.adapter;
    loggerService.log('Secure Axios configured', 'Bootstrap');
    
    // Set up global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties not defined in DTOs
        forbidNonWhitelisted: true, // Throw errors for non-whitelisted properties
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
        disableErrorMessages: nodeEnv === 'production', // Disable detailed error messages in production
      }),
    );
    loggerService.log('Global validation pipe configured', 'Bootstrap');
    
    // Set up Swagger documentation if not in production
    if (nodeEnv !== 'production') {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Gamification Engine API')
        .setDescription('API documentation for the AUSTA SuperApp Gamification Engine')
        .setVersion('1.0')
        .addTag('gamification')
        .addBearerAuth()
        .build();
      
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
      loggerService.log(`Swagger documentation available at /${apiPrefix}/docs`, 'Bootstrap');
    }
    
    // Retrieve the KafkaConsumerService from the application context
    const kafkaConsumerService = app.get(KafkaConsumerService);
    
    // Start the Kafka consumer to listen for events
    await kafkaConsumerService.onModuleInit();
    loggerService.log('Kafka consumer initialized', 'Bootstrap');
    
    // Start listening for incoming requests
    await app.listen(port);
    loggerService.log(`Gamification Engine service started on port ${port}`, 'Bootstrap');
    
    // Log application URLs
    const serverUrl = await app.getUrl();
    loggerService.log(`Server running at ${serverUrl}`, 'Bootstrap');
    
    if (nodeEnv !== 'production') {
      loggerService.log(`Swagger documentation: ${serverUrl}/${apiPrefix}/docs`, 'Bootstrap');
    }
    
    // Handle shutdown gracefully
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        loggerService.log(`Received ${signal} signal, shutting down gracefully`, 'Bootstrap');
        await app.close();
        process.exit(0);
      });
    });
    
  } catch (error) {
    // Use NestJS Logger as fallback if LoggerService is not available
    const logger = new Logger('Bootstrap');
    logger.error(`Failed to start Gamification Engine service: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Call the bootstrap function to start the Gamification Engine service
bootstrap();
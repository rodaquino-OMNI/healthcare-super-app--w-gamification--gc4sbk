import { NestFactory } from '@nestjs/core'; // @nestjs/core v10.3.0+
import { AppModule } from './app.module';
import { Configuration } from './config/configuration';
import { AuthMiddleware } from './middleware/auth.middleware';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { LoggerService } from '@app/shared/logging/logger.service';
import { GlobalExceptionFilter } from '@austa/errors/nest/filters';
import { ErrorType } from '@austa/errors/types';
import { ApiGatewayConfig } from '@austa/interfaces/common/dto';
import { 
  RetryInterceptor, 
  CircuitBreakerInterceptor, 
  FallbackInterceptor,
  TimeoutInterceptor
} from '@austa/errors/nest/interceptors';
import { ErrorsModule } from '@austa/errors/nest/module';

/**
 * Bootstraps the NestJS application, configures middleware, and starts the server.
 * Implements standardized error handling with retry policies, circuit breakers, and fallback strategies.
 */
async function bootstrap() {
  // Creates a NestJS application instance with enhanced logging
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is available
  });

  // Retrieves the application configuration with type safety
  const config = app.get<Configuration>(Configuration);
  const apiConfig = config.api as ApiGatewayConfig;

  // Configure the logger as early as possible
  const logger = app.get(LoggerService);
  logger.setContext('ApiGateway');
  app.useLogger(logger);

  // Apply global exception filter with enhanced error handling
  const exceptionFilter = app.get(GlobalExceptionFilter);
  app.useGlobalFilters(exceptionFilter);

  // Apply global interceptors for enhanced error handling
  app.useGlobalInterceptors(
    // Timeout interceptor to prevent hanging requests
    new TimeoutInterceptor(apiConfig.timeout || 30000),
    // Retry interceptor with exponential backoff for transient errors
    new RetryInterceptor({
      maxRetries: apiConfig.retry?.maxRetries || 3,
      initialDelayMs: apiConfig.retry?.initialDelayMs || 100,
      maxDelayMs: apiConfig.retry?.maxDelayMs || 1000,
      retryableErrors: [ErrorType.TRANSIENT, ErrorType.NETWORK, ErrorType.TIMEOUT]
    }),
    // Circuit breaker for external dependencies
    new CircuitBreakerInterceptor({
      failureThreshold: apiConfig.circuitBreaker?.failureThreshold || 50,
      resetTimeoutMs: apiConfig.circuitBreaker?.resetTimeoutMs || 10000,
      monitoredErrors: [ErrorType.EXTERNAL_DEPENDENCY, ErrorType.NETWORK, ErrorType.TIMEOUT]
    }),
    // Fallback strategies for graceful degradation
    new FallbackInterceptor({
      enabledForErrors: [ErrorType.CIRCUIT_OPEN, ErrorType.TIMEOUT, ErrorType.NETWORK]
    })
  );

  // Apply the authentication middleware to secure the API Gateway
  // The AuthMiddleware requires AuthService, UsersService, LoggerService, and Configuration
  app.use(app.get(AuthMiddleware).use.bind(app.get(AuthMiddleware)));

  // Apply the logging middleware to log requests and responses
  // The LoggingMiddleware requires LoggerService
  app.use(app.get(LoggingMiddleware).use.bind(app.get(LoggingMiddleware)));

  // Apply the rate limiting middleware to protect against abuse
  // The RateLimitMiddleware requires RedisService and ConfigService
  app.use(app.get(RateLimitMiddleware).use.bind(app.get(RateLimitMiddleware)));

  // Enable CORS for cross-origin requests
  if (apiConfig.cors?.enabled) {
    app.enableCors({
      origin: apiConfig.cors.allowedOrigins || '*',
      methods: apiConfig.cors.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: apiConfig.cors.allowCredentials || true,
      maxAge: apiConfig.cors.maxAge || 86400
    });
  }

  // Set global prefix if configured
  if (apiConfig.globalPrefix) {
    app.setGlobalPrefix(apiConfig.globalPrefix);
  }

  // Start the server and listen for incoming requests on the configured port
  const port = apiConfig.port || config.port || 4000;
  await app.listen(port);

  // Log a message indicating that the server has started successfully
  logger.log(`API Gateway started on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

// Call the bootstrap function to start the application
bootstrap().catch(err => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
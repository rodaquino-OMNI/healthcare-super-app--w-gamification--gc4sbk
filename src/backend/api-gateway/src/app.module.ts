import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'; // @nestjs/common v10.3.0+
import { GraphQLModule } from '@nestjs/graphql'; // @nestjs/graphql v12.0.0+
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'; // @nestjs/apollo v12.0.0+
import { ConfigModule } from '@nestjs/config'; // @nestjs/config v10.0.0+

// Import from @austa/errors package for enhanced error handling
import { ErrorsModule } from '@austa/errors/nest';
import { RetryInterceptor, CircuitBreakerInterceptor, FallbackInterceptor } from '@austa/errors/nest';

// Import from @austa/interfaces package for type-safe models
import { ApiResponseTypes } from '@austa/interfaces/api/response.types';
import { ApiErrorTypes } from '@austa/interfaces/api/error.types';
import { ApiRequestTypes } from '@austa/interfaces/api/request.types';

// Use standardized path aliases for local imports
import configuration from '@app/api-gateway/config/configuration';
import { AuthMiddleware } from '@app/api-gateway/middleware/auth.middleware';
import { LoggingMiddleware } from '@app/api-gateway/middleware/logging.middleware';
import { resolvers } from '@app/api-gateway/graphql/resolvers';

// Use standardized path aliases for service imports
import { TracingModule } from '@app/shared/tracing';
import { LoggingModule } from '@app/shared/logging';
import { AuthModule } from '@app/auth/auth';
import { HealthModule } from '@app/health/health';
import { AppointmentsModule } from '@app/care/appointments';
import { ClaimsModule } from '@app/plan/claims';
import { AchievementsModule } from '@app/gamification/achievements';
import { NotificationsModule } from '@app/notification/notifications';

/**
 * The root module for the API Gateway, configuring GraphQL, middleware, and feature modules.
 * 
 * This module is responsible for:
 * - Loading environment-based application settings via ConfigModule
 * - Configuring and initializing the GraphQL API with ApolloDriver
 * - Setting up enhanced error handling with centralized policies
 * - Aggregating and exposing feature modules from all journeys
 * - Enforcing request-level middleware for authentication and logging
 */
@Module({
  imports: [
    // Global configuration with environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }), 
    
    // GraphQL configuration with type-safe models
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.graphql',
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production',
      resolvers: resolvers,
      formatError: (error) => {
        // Use type-safe error formatting from @austa/interfaces
        const formattedError: ApiErrorTypes.GraphQLErrorResponse = {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_ERROR',
          path: error.path,
          // Include additional context for client-friendly messages
          context: error.extensions?.context || {},
        };
        return formattedError;
      },
      context: ({ req }) => ({ req }),
    }), 
    
    // Enhanced error handling with centralized policies
    ErrorsModule.forRoot({
      // Configure global error handling behavior
      enableGlobalFilters: true,
      // Enable retry policies for transient errors
      enableRetryInterceptor: true,
      // Enable circuit breaker for external dependencies
      enableCircuitBreaker: true,
      // Configure fallback strategies
      fallbackStrategies: {
        // Default fallback returns cached data when available
        default: 'cache',
      },
    }),
    
    // Cross-cutting concerns
    TracingModule,
    LoggingModule,
    
    // Journey-specific feature modules
    AuthModule,
    HealthModule, 
    AppointmentsModule, 
    ClaimsModule, 
    AchievementsModule, 
    NotificationsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
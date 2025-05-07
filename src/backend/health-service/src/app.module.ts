import { Module } from '@nestjs/common'; // NestJS Common 10.3.0+
import { ConfigModule } from '@nestjs/config'; // NestJS Config 2.3.1+

// Import modules using TypeScript path aliases for consistent code organization
import { HealthModule } from '@app/health/health/health.module'; // Core module for managing health metrics, goals, and medical history
import { DevicesModule } from '@app/health/devices/devices.module'; // Manages device connections for health data synchronization
import { InsightsModule } from '@app/health/insights/insights.module'; // Provides health insights and recommendations based on user data
import { FhirModule } from '@app/health/integrations/fhir/fhir.module'; // Integrates with external health record systems using FHIR standard
import { WearablesModule } from '@app/health/integrations/wearables/wearables.module'; // Manages integration with various wearable devices

// Import shared services and modules using TypeScript path aliases
import { DatabaseModule, PrismaService } from '@austa/database'; // Enhanced database access with connection pooling
import { LoggerModule } from '@app/shared/logging/logger.module'; // Provides consistent logging across the service
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module'; // Provides global exception handling
import { KafkaModule } from '@app/shared/kafka/kafka.module'; // Enables event streaming for gamification and notifications
import { RedisModule } from '@app/shared/redis/redis.module'; // Provides caching and real-time data capabilities
import { TracingModule } from '@app/shared/tracing/tracing.module'; // Enables distributed tracing for monitoring and debugging

// Import configuration and validation
import { health } from '@app/health/config/configuration'; // Configuration function for the Health Service
import { validationSchema } from '@app/health/config/validation.schema'; // Validation schema for environment variables

/**
 * Root module for the Health Service that orchestrates all components required for the My Health Journey.
 * It imports and configures all necessary modules including health data management, device connections,
 * integrations with external systems, and cross-cutting concerns like logging and event processing.
 * 
 * The module uses TypeScript path aliases for consistent code organization and integrates with
 * the enhanced PrismaService for improved database performance and error handling.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ // Configures the ConfigModule to load environment variables and validate them.
      load: [health], // Loads the health-specific configuration.
      validationSchema, // Uses the Joi validation schema to validate the environment variables.
      isGlobal: true, // Makes the ConfigModule globally available.
    }),
    // Import the DatabaseModule for enhanced database access with connection pooling
    DatabaseModule.forRoot({
      connectionPoolSize: 10, // Configure connection pooling for improved performance
      enableQueryLogging: process.env.NODE_ENV !== 'production', // Enable query logging in non-production environments
      retryAttempts: 3, // Configure retry attempts for failed database operations
      retryDelay: 1000, // Configure retry delay in milliseconds
    }),
    LoggerModule, // Imports the LoggerModule for application-wide logging.
    ExceptionsModule, // Imports the ExceptionsModule for global exception handling.
    KafkaModule, // Imports the KafkaModule for event streaming.
    RedisModule, // Imports the RedisModule for caching.
    TracingModule, // Imports the TracingModule for distributed tracing.
    HealthModule, // Imports the HealthModule for managing health data.
    DevicesModule, // Imports the DevicesModule for managing device connections.
    InsightsModule, // Imports the InsightsModule for generating health insights.
    FhirModule, // Imports the FhirModule for integrating with external health record systems.
    WearablesModule, // Imports the WearablesModule for integrating with wearable devices.
  ],
  controllers: [], // No controllers are defined directly in the AppModule.
  providers: [PrismaService], // Provides the PrismaService for database access.
})
export class AppModule {
  /**
   * The constructor is empty as this is a module class.
   */
  constructor() {}
}
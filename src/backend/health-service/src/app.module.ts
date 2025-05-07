import { Module } from '@nestjs/common'; // NestJS Common 10.0.0+
import { ConfigModule } from '@nestjs/config'; // NestJS Config 2.3.1+

// Feature modules
import { HealthModule } from './health/health.module'; // Core module for managing health metrics, goals, and medical history
import { DevicesModule } from './devices/devices.module'; // Manages device connections for health data synchronization
import { InsightsModule } from './insights/insights.module'; // Provides health insights and recommendations based on user data

// Integration modules
import { FhirModule } from './integrations/fhir/fhir.module'; // Integrates with external health record systems using FHIR standard
import { WearablesModule } from './integrations/wearables/wearables.module'; // Manages integration with various wearable devices

// Monitoring and infrastructure modules
import { HealthCheckModule } from './monitoring'; // Provides health check endpoints and metrics collection

// Import from @austa packages using TypeScript path aliases
import { PrismaService } from '@austa/database'; // Database access service using Prisma ORM
import { LoggingModule } from '@austa/logging'; // Provides consistent logging across the service
import { ErrorsModule } from '@austa/errors/nest'; // Provides global exception handling
import { EventsModule } from '@austa/events'; // Enables event streaming for gamification and notifications
import { TracingModule } from '@austa/tracing'; // Enables distributed tracing for monitoring and debugging

// Configuration
import { health } from './config/configuration'; // Configuration function for the Health Service
import { validationSchema } from './config/validation.schema'; // Validation schema for environment variables

/**
 * Root module for the Health Service that orchestrates all components required for the My Health Journey.
 * It imports and configures all necessary modules including health data management, device connections,
 * integrations with external systems, and cross-cutting concerns like logging, tracing, and error handling.
 */
@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      load: [health],
      validationSchema,
      isGlobal: true,
    }),
    
    // Infrastructure modules
    LoggingModule.forRoot(),
    TracingModule.forRoot(),
    ErrorsModule.forRoot(),
    EventsModule.forRoot({
      clientId: 'health-service',
      brokers: process.env.EVENTS_KAFKA_BROKERS?.split(',') || [],
      groupId: 'health-service-group',
    }),
    
    // Monitoring
    HealthCheckModule,
    
    // Feature modules
    HealthModule,
    DevicesModule,
    InsightsModule,
    
    // Integration modules
    FhirModule,
    WearablesModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
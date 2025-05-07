import { Module } from '@nestjs/common';
import { InsightsController } from '@app/insights/insights.controller';
import { InsightsService } from '@app/insights/insights.service';
import { HealthModule } from '@app/health/health.module';
import { LoggerModule } from '@austa/logging';
import { ErrorsModule } from '@austa/errors';
import { DatabaseModule, HealthDatabaseContext } from '@austa/database';
import { 
  HEALTH_INSIGHTS_SERVICE,
  HEALTH_DATABASE_CONTEXT,
  HEALTH_ERROR_HANDLER 
} from '@austa/interfaces/journey/health';
import { HealthErrorHandler } from '@austa/errors/journey/health';

/**
 * Configures the InsightsModule, which aggregates the controller and service responsible
 * for generating health insights based on user health data.
 * 
 * This module:
 * - Integrates with the HealthModule to access health metrics and goals
 * - Uses the ErrorsModule for standardized error handling with health-specific error types
 * - Leverages the DatabaseModule with the health context for optimized database access
 * - Provides dependency injection tokens for consistent service resolution
 * 
 * The module implements the journey-centered architecture approach by using standardized
 * imports with TypeScript path aliases and proper dependency injection patterns.
 */
@Module({
  imports: [
    HealthModule,
    LoggerModule,
    // Configure error handling specific to the health journey's insights context
    ErrorsModule.forFeature({
      journey: 'health',
      contextName: 'insights'
    }),
    // Configure database access with health-specific optimizations
    DatabaseModule.forFeature({
      contextType: 'health'
    })
  ],
  controllers: [InsightsController],
  providers: [
    // Register the concrete service implementation
    InsightsService,
    
    // Register the service with its interface token for dependency injection
    {
      provide: HEALTH_INSIGHTS_SERVICE,
      useExisting: InsightsService
    },
    
    // Register the health database context provider
    {
      provide: HEALTH_DATABASE_CONTEXT,
      useClass: HealthDatabaseContext
    },
    
    // Register the health error handler for insights-specific errors
    {
      provide: HEALTH_ERROR_HANDLER,
      useClass: HealthErrorHandler
    }
  ],
  exports: [
    // Export both the concrete service and its interface token
    InsightsService, 
    HEALTH_INSIGHTS_SERVICE,
    HEALTH_DATABASE_CONTEXT,
    HEALTH_ERROR_HANDLER
  ]
})
export class InsightsModule {}
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DevicesModule } from '@app/health/devices/devices.module';
import { ExceptionsModule } from '@austa/errors';
import { LoggerModule } from '@austa/logging';
import { WearablesModule } from '@app/health/integrations/wearables/wearables.module';
import { KafkaModule } from '@austa/events';
import { DatabaseModule } from '@austa/database';

/**
 * Configures the HealthModule, which aggregates the controller and service responsible for managing health data.
 * This module integrates with various services including device management, wearable integrations,
 * and cross-cutting concerns like logging, error handling, and event streaming.
 */
@Module({
  imports: [
    // Feature modules
    DevicesModule,
    WearablesModule,
    
    // Cross-cutting concerns
    DatabaseModule,
    ExceptionsModule,
    LoggerModule,
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
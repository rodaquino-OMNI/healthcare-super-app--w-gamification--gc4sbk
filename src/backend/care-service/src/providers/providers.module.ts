import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { ExceptionsModule } from '@austa/errors';
import { LoggerModule } from '@austa/logging';

/**
 * ProvidersModule encapsulates all provider-related functionality for the Care Journey.
 *
 * This module is responsible for managing healthcare providers, including doctors,
 * specialists, clinics, and hospitals that are available for appointments and
 * telemedicine sessions within the Care Journey of the AUSTA SuperApp.
 *
 * @module ProvidersModule
 * @category Care Journey
 *
 * @remarks
 * The module maintains clear boundaries with other journey services by focusing
 * exclusively on provider management within the Care context. It exports
 * ProvidersService for use by other modules within the Care Journey service
 * but does not expose implementation details.
 */
@Module({
  imports: [ExceptionsModule, LoggerModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
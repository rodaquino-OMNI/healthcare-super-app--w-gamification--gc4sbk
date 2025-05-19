import { Module } from '@nestjs/common'; // v10.3.0+

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@app/shared/database/prisma.service';
import { ProvidersModule } from '../providers/providers.module';
import { TelemedicineModule } from '../telemedicine/telemedicine.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';

/**
 * AppointmentsModule encapsulates all appointment-related functionality within the Care Service.
 * It configures dependency injection for the AppointmentsController and AppointmentsService,
 * and imports required dependencies from other modules.
 *
 * This module implements the following requirements:
 * - Clarifies service boundaries between journey services
 * - Establishes proper package exposure patterns with clear public APIs
 * - Creates standardized module resolution across the monorepo
 * - Implements consistent dependency management between services
 */
@Module({
  imports: [
    // Import ProvidersModule to use ProvidersService for provider availability checks
    ProvidersModule,
    // Import TelemedicineModule to use TelemedicineService for telemedicine session management
    TelemedicineModule,
    // Import KafkaModule for event streaming capabilities
    KafkaModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    // Register AppointmentsService as a provider
    AppointmentsService,
    // Register PrismaService for database access
    PrismaService,
  ],
  // Export AppointmentsService for use in other modules
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
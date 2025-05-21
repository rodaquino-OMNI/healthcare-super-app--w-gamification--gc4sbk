import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@app/shared/database/prisma.service';
import { ProvidersModule } from '../providers/providers.module';
import { TelemedicineModule } from '../telemedicine/telemedicine.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { LoggerModule } from '@app/shared/logging/logger.module';

/**
 * Appointments Module for the Care Journey
 * 
 * This module is responsible for managing healthcare appointments within the Care Journey,
 * enabling users to schedule, reschedule, and manage appointments with healthcare providers.
 * It implements the appointment booking requirements for the Care Now journey (F-102-RQ-002).
 * 
 * The module provides functionality for:
 * - Creating and scheduling appointments with healthcare providers
 * - Managing appointment status (scheduled, confirmed, completed, cancelled)
 * - Initiating telemedicine sessions for virtual appointments
 * - Publishing appointment-related events for gamification and notifications
 * 
 * The module integrates with:
 * - Providers module for healthcare provider information and availability
 * - Telemedicine module for virtual appointment sessions
 * - Kafka for event streaming (appointment created, updated, completed events)
 * - Prisma for database access with proper connection management
 * 
 * @module AppointmentsModule
 */
@Module({
  imports: [
    // Core infrastructure modules
    KafkaModule,
    LoggerModule,
    ExceptionsModule,
    
    // Feature modules
    ProvidersModule,
    TelemedicineModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Use TypeScript path aliases for consistent code organization
import { DevicesService } from '@app/health/devices/devices.service';
import { DevicesController } from '@app/health/devices/devices.controller';
import { DeviceConnection } from '@app/health/devices/entities/device-connection.entity';
import { PrismaService } from '@austa/database/connection/prisma.service';
import { LoggerService } from '@austa/logging';

/**
 * Module that organizes the devices feature within the health service.
 * Provides controllers, services, and repositories for managing wearable device connections.
 * 
 * Addresses requirement F-101-RQ-004: Connect with supported wearable devices
 * to import health metrics.
 */
@Module({
  imports: [
    // Add TypeORM repository providers for DeviceConnection entity
    TypeOrmModule.forFeature([DeviceConnection])
  ],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    // Configure module with proper dependency injection for the PrismaService
    PrismaService,
    // Add LoggerService for consistent logging across the application
    LoggerService
  ],
  exports: [DevicesService, TypeOrmModule]
})
export class DevicesModule {}
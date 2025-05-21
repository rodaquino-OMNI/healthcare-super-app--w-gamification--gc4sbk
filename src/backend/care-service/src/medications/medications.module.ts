import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { CareContext } from '@app/database/contexts';

import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';

/**
 * Configures the MedicationsModule for managing medication-related features.
 * This module is responsible for medication tracking within the Care Now journey,
 * allowing users to manage their medications, set reminders, and monitor adherence.
 * 
 * Uses the enhanced PrismaService with journey-specific optimizations through the
 * CareContext, which provides specialized methods for medication management.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [MedicationsController],
  providers: [MedicationsService, CareContext],
  exports: [MedicationsService],
})
export class MedicationsModule {}
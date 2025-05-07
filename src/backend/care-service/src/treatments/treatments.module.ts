import { Module } from '@nestjs/common';
import { TreatmentsService } from '@app/care/treatments/treatments.service';
import { TreatmentsController } from '@app/care/treatments/treatments.controller';
import { DatabaseModule } from '@app/database';
import { LoggingModule } from '@app/logging';
import { TracingModule } from '@app/tracing';

/**
 * Configures the TreatmentsModule in NestJS, which encapsulates the treatment plan-related features
 * within the Care Service. This module imports and exports the TreatmentsService 
 * and TreatmentsController, making them available for use by other modules within the Care Service.
 * 
 * This module implements the Treatment Plan Execution requirement (F-102-RQ-005) from the Care Now journey,
 * allowing users to view and track progress of their prescribed treatment plans.
 */
@Module({
  imports: [
    DatabaseModule,
    LoggingModule,
    TracingModule
  ],
  controllers: [TreatmentsController],
  providers: [
    {
      provide: TreatmentsService,
      useClass: TreatmentsService
    }
  ],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
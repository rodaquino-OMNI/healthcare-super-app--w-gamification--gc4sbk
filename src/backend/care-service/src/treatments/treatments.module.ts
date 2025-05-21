import { Module } from '@nestjs/common'; // ^10.3.0
import { TreatmentsService } from '@app/care/treatments/treatments.service';
import { TreatmentsController } from '@app/care/treatments/treatments.controller';

/**
 * Configures the TreatmentsModule in NestJS, which encapsulates the treatment plan-related features
 * within the Care Service. This module imports and exports the TreatmentsService 
 * and TreatmentsController, making them available for use by other modules within the Care Service.
 * 
 * This module implements the Treatment Plan Execution requirement (F-102-RQ-005) from the Care Now journey,
 * allowing users to view and track progress of their prescribed treatment plans.
 */
@Module({
  controllers: [TreatmentsController],
  providers: [TreatmentsService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
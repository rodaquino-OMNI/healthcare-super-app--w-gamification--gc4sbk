import { Module } from '@nestjs/common';
import { SymptomCheckerController } from '@app/care/symptom-checker/symptom-checker.controller';
import { SymptomCheckerService } from '@app/care/symptom-checker/symptom-checker.service';

/**
 * Configures the SymptomCheckerModule, which encapsulates the symptom checker functionality
 * for the Care Now journey. This module is part of the Care Service and implements
 * requirement F-111 (Symptom Checker) allowing users to input symptoms and receive 
 * preliminary guidance for appropriate next steps based on symptom severity.
 */
@Module({
  controllers: [SymptomCheckerController],
  providers: [SymptomCheckerService],
  exports: [SymptomCheckerService], // Export service for reuse in other modules
})
export class SymptomCheckerModule {}
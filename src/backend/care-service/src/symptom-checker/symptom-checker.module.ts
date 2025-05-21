import { Module } from '@nestjs/common'; // v10.3.0
import { SymptomCheckerController } from './symptom-checker.controller';
import { SymptomCheckerService } from './symptom-checker.service';

/**
 * Configures the SymptomCheckerModule, which encapsulates the symptom checker functionality
 * for the Care Now journey. This module is part of the Care Service and implements
 * requirement F-111 allowing users to input symptoms and receive preliminary guidance.
 *
 * The Symptom Checker provides an interactive tool for users to input symptoms and receive
 * preliminary guidance, performing initial triage based on symptom severity and recommending
 * appropriate next steps for care.
 */
@Module({
  controllers: [SymptomCheckerController],
  providers: [SymptomCheckerService],
  exports: [SymptomCheckerService], // Export service for reuse in other modules
})
export class SymptomCheckerModule {}
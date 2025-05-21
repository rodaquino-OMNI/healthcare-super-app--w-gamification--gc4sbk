import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';

import { FhirService } from '@app/health/integrations/fhir/fhir.service';
import { FHIRAdapter } from '@app/health/integrations/fhir/fhir.adapter';

/**
 * Configures the FHIR integration module for the Health Service.
 * This module provides functionality to interact with external FHIR-compliant healthcare systems
 * for retrieving patient records and medical history data.
 * 
 * Addresses requirement:
 * - F-101: Integrates with external health record systems to retrieve medical history
 * - F-103-RQ-001: Retrieves and processes medical events for Medical History View
 */
@Module({
  imports: [
    LoggerModule,
    TracingModule,
    EventEmitterModule.forRoot({
      // Global event emitter configuration
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  controllers: [],
  providers: [
    FhirService,
    FHIRAdapter,
  ],
  exports: [FhirService],
})
export class FhirModule {}
import { Module } from '@nestjs/common';
import { FhirService } from '@app/health/integrations/fhir/fhir.service';
import { FHIRAdapter } from '@app/health/integrations/fhir/fhir.adapter';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

/**
 * Configures the FHIR integration module for the Health Service.
 * This module provides functionality to interact with external FHIR-compliant healthcare systems
 * for retrieving patient records and medical history data.
 * 
 * The module imports necessary dependencies for logging and tracing to ensure proper
 * monitoring and observability of FHIR API interactions. It registers both the FHIRAdapter
 * for direct API communication and the FhirService which orchestrates higher-level operations.
 * 
 * Addresses requirement:
 * - F-103-RQ-001: Display Medical History View requires proper module configuration for FHIR integration
 */
@Module({
  imports: [
    LoggerModule,
    TracingModule
  ],
  controllers: [],
  providers: [FHIRAdapter, FhirService],
  exports: [FhirService],
})
export class FhirModule {}
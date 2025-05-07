import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Import from @austa packages using path aliases
import { IHealthMetric, IMedicalEvent, MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { IBaseEvent } from '@austa/events/interfaces/base-event.interface';
import { HealthEventType } from '@austa/interfaces/journey/health/events';
import { ErrorCategory, JourneyError } from '@austa/errors/journey';
import { HealthErrorCode } from '@austa/errors/journey/health';
import { validate } from '@austa/utils/validation';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

// Import from local modules using path aliases
import { health } from '@app/health/config/configuration';
import { FHIRAdapter } from '@app/health/integrations/fhir/fhir.adapter';

/**
 * Handles the retrieval of patient data from FHIR-compliant systems and emits events when new data is available.
 * 
 * This service orchestrates communication with external FHIR-compliant healthcare systems,
 * transforms FHIR resources into internal entity models, and emits domain events for data updates.
 * 
 * Addresses requirements:
 * - F-103-RQ-001: Display Medical History View requires retrieval and processing of medical events from FHIR API
 * - Integration with standardized event schemas for consistent event processing
 */
@Injectable()
export class FhirService {
  private readonly config: ReturnType<typeof health>;

  /**
   * Initializes the FhirService.
   * 
   * @param fhirAdapter - The adapter for communicating with FHIR-compliant systems
   * @param logger - Logger service for consistent logging
   * @param eventEmitter - Event emitter for publishing data retrieval events
   * @param tracingService - Tracing service for distributed tracing
   */
  constructor(
    private readonly fhirAdapter: FHIRAdapter,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tracingService: TracingService
  ) {
    this.config = health();
  }

  /**
   * Retrieves a patient record from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to the patient record
   */
  async getPatientRecord(patientId: string): Promise<any> {
    return this.tracingService.createSpan('fhir.getPatientRecord', async () => {
      // Log the retrieval attempt
      this.logger.log(`Retrieving patient record for patient ID: ${patientId}`, 'FhirService');
      
      try {
        // Call the FHIR adapter to retrieve the patient record
        const patientRecord = await this.fhirAdapter.getPatientRecord(patientId);
        
        // Validate the patient record
        validate.object(patientRecord, {
          id: validate.required().string(),
          resourceType: validate.required().string().equals('PatientRecord'),
          firstName: validate.string(),
          lastName: validate.string(),
          fullName: validate.string(),
          gender: validate.string(),
          birthDate: validate.optional().date(),
          contact: validate.optional().object(),
          address: validate.optional().object(),
          identifiers: validate.optional().array(validate.object()),
          source: validate.required().string().equals('FHIR')
        });
        
        // Emit a standardized event with the patient data
        const event: IBaseEvent<any> = {
          eventId: `patient-record-${patientId}-${Date.now()}`,
          timestamp: new Date(),
          version: '1.0.0',
          source: 'health-service',
          type: HealthEventType.PATIENT_RECORD_RETRIEVED,
          payload: {
            patientId,
            data: patientRecord,
            timestamp: new Date()
          },
          metadata: {
            correlationId: this.tracingService.getCurrentTraceId()
          }
        };
        
        this.eventEmitter.emit(HealthEventType.PATIENT_RECORD_RETRIEVED, event);
        
        // Return the patient record
        return patientRecord;
      } catch (error) {
        this.logger.error(
          `Failed to retrieve patient record for patient ID: ${patientId}`,
          error.stack,
          'FhirService'
        );
        
        if (error instanceof JourneyError) {
          throw error;
        }
        
        throw new JourneyError(
          'Failed to retrieve patient record',
          {
            category: ErrorCategory.EXTERNAL_SERVICE,
            code: HealthErrorCode.FHIR_PATIENT_RETRIEVAL_FAILED,
            details: { patientId },
            cause: error
          }
        );
      }
    });
  }

  /**
   * Retrieves a patient's medical history from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to an array of medical events
   */
  async getMedicalHistory(patientId: string): Promise<IMedicalEvent[]> {
    return this.tracingService.createSpan('fhir.getMedicalHistory', async () => {
      // Log the medical history retrieval attempt
      this.logger.log(`Retrieving medical history for patient ID: ${patientId}`, 'FhirService');
      
      try {
        // Call the FHIR adapter to retrieve the medical history
        const medicalEvents = await this.fhirAdapter.getMedicalHistory(patientId);
        
        // Validate each medical event
        medicalEvents.forEach(event => {
          validate.object(event, {
            id: validate.required().string(),
            type: validate.required().string(),
            description: validate.optional().string(),
            date: validate.required().date(),
            provider: validate.optional().string(),
            documents: validate.optional().array(validate.string())
          });
        });
        
        // Emit a standardized event with the medical events
        const event: IBaseEvent<any> = {
          eventId: `medical-history-${patientId}-${Date.now()}`,
          timestamp: new Date(),
          version: '1.0.0',
          source: 'health-service',
          type: HealthEventType.MEDICAL_HISTORY_RETRIEVED,
          payload: {
            patientId,
            events: medicalEvents,
            count: medicalEvents.length,
            timestamp: new Date()
          },
          metadata: {
            correlationId: this.tracingService.getCurrentTraceId()
          }
        };
        
        this.eventEmitter.emit(HealthEventType.MEDICAL_HISTORY_RETRIEVED, event);
        
        // Return the array of medical events
        return medicalEvents;
      } catch (error) {
        this.logger.error(
          `Failed to retrieve medical history for patient ID: ${patientId}`,
          error.stack,
          'FhirService'
        );
        
        if (error instanceof JourneyError) {
          throw error;
        }
        
        throw new JourneyError(
          'Failed to retrieve medical history',
          {
            category: ErrorCategory.EXTERNAL_SERVICE,
            code: HealthErrorCode.FHIR_MEDICAL_HISTORY_RETRIEVAL_FAILED,
            details: { patientId },
            cause: error
          }
        );
      }
    });
  }

  /**
   * Retrieves health metrics from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @param metricType - The type of health metric to retrieve
   * @param dateRange - Optional date range to filter metrics
   * @returns A promise that resolves to an array of health metrics
   */
  async getHealthMetricsFromFhir(
    patientId: string,
    metricType: MetricType,
    dateRange?: { start?: Date; end?: Date }
  ): Promise<IHealthMetric[]> {
    return this.tracingService.createSpan('fhir.getHealthMetricsFromFhir', async () => {
      // Log the health metrics retrieval attempt
      this.logger.log(
        `Retrieving health metrics of type ${metricType} for patient ID: ${patientId}`,
        'FhirService'
      );
      
      try {
        // Construct the appropriate FHIR query based on metricType and dateRange
        const query = {
          patient: patientId,
          code: this.mapMetricTypeToFhirCode(metricType),
          // Add date range parameters if provided
          ...(dateRange ? { date: this.formatDateRangeForFhir(dateRange) } : {})
        };
        
        // Call the FHIR adapter to retrieve the health metrics
        const observations = await this.fhirAdapter.getObservations(query);
        
        // Transform the FHIR observations into the internal HealthMetric format
        const metrics = observations.map(obs => this.transformObservationToMetric(obs, patientId, metricType));
        
        // Validate each health metric
        metrics.forEach(metric => {
          validate.object(metric, {
            userId: validate.required().string(),
            type: validate.required().string(),
            value: validate.required().number(),
            unit: validate.string(),
            timestamp: validate.required().date(),
            source: validate.required().string().equals('FHIR'),
            notes: validate.optional().string().nullable(),
            isAbnormal: validate.boolean()
          });
        });
        
        // Emit a standardized event with the health metrics
        const event: IBaseEvent<any> = {
          eventId: `health-metrics-${patientId}-${metricType}-${Date.now()}`,
          timestamp: new Date(),
          version: '1.0.0',
          source: 'health-service',
          type: HealthEventType.HEALTH_METRICS_RETRIEVED,
          payload: {
            patientId,
            metricType,
            metrics,
            count: metrics.length,
            timestamp: new Date()
          },
          metadata: {
            correlationId: this.tracingService.getCurrentTraceId()
          }
        };
        
        this.eventEmitter.emit(HealthEventType.HEALTH_METRICS_RETRIEVED, event);
        
        // Return the array of health metrics
        return metrics;
      } catch (error) {
        this.logger.error(
          `Failed to retrieve health metrics of type ${metricType} for patient ID: ${patientId}`,
          error.stack,
          'FhirService'
        );
        
        if (error instanceof JourneyError) {
          throw error;
        }
        
        throw new JourneyError(
          'Failed to retrieve health metrics',
          {
            category: ErrorCategory.EXTERNAL_SERVICE,
            code: HealthErrorCode.FHIR_HEALTH_METRICS_RETRIEVAL_FAILED,
            details: { patientId, metricType },
            cause: error
          }
        );
      }
    });
  }
  
  /**
   * Maps an internal metric type to a FHIR code.
   * 
   * @param metricType - The internal metric type
   * @returns The corresponding FHIR code
   * @private
   */
  private mapMetricTypeToFhirCode(metricType: MetricType): string {
    // This is a simplified mapping, a real implementation would be more comprehensive
    const codeMap: Record<MetricType, string> = {
      [MetricType.HEART_RATE]: '8867-4', // LOINC code for heart rate
      [MetricType.BLOOD_PRESSURE]: '85354-9', // LOINC code for blood pressure panel
      [MetricType.BLOOD_GLUCOSE]: '2339-0', // LOINC code for glucose
      [MetricType.WEIGHT]: '29463-7', // LOINC code for body weight
      [MetricType.HEIGHT]: '8302-2', // LOINC code for body height
      [MetricType.STEPS]: '41950-7', // LOINC code for number of steps in 24 hour measured
      [MetricType.TEMPERATURE]: '8310-5', // LOINC code for body temperature
      [MetricType.OXYGEN_SATURATION]: '59408-5', // LOINC code for oxygen saturation
      [MetricType.RESPIRATORY_RATE]: '9279-1', // LOINC code for respiratory rate
      [MetricType.SLEEP]: '93832-4', // LOINC code for sleep duration
      [MetricType.ACTIVITY]: '41981-2', // LOINC code for activity score
      [MetricType.CALORIES]: '41979-6' // LOINC code for calories burned
    };
    
    return codeMap[metricType] || metricType;
  }
  
  /**
   * Formats a date range object for FHIR query parameters.
   * 
   * @param dateRange - The date range object
   * @returns Formatted date range for FHIR query
   * @private
   */
  private formatDateRangeForFhir(dateRange: { start?: Date; end?: Date }): string {
    const { start, end } = dateRange;
    let formattedRange = '';
    
    if (start && end) {
      formattedRange = `ge${this.formatDateForFhir(start)}&le${this.formatDateForFhir(end)}`;
    } else if (start) {
      formattedRange = `ge${this.formatDateForFhir(start)}`;
    } else if (end) {
      formattedRange = `le${this.formatDateForFhir(end)}`;
    }
    
    return formattedRange;
  }
  
  /**
   * Formats a date for FHIR query parameters.
   * 
   * @param date - The date to format
   * @returns Formatted date string (YYYY-MM-DD)
   * @private
   */
  private formatDateForFhir(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Transforms a FHIR observation to an internal metric.
   * 
   * @param observation - The FHIR observation
   * @param patientId - The patient identifier
   * @param metricType - The metric type
   * @returns The transformed metric
   * @private
   */
  private transformObservationToMetric(observation: any, patientId: string, metricType: MetricType): IHealthMetric {
    // Validate the FHIR observation structure
    validate.object(observation, {
      id: validate.required().string(),
      resourceType: validate.required().string().equals('Observation'),
      status: validate.required().string(),
      code: validate.required().object(),
      subject: validate.required().object({
        reference: validate.required().string()
      }),
      effectiveDateTime: validate.optional().string(),
      valueQuantity: validate.optional().object({
        value: validate.optional().number(),
        unit: validate.optional().string()
      }),
      note: validate.optional().array(validate.object({
        text: validate.optional().string()
      }))
    });
    
    // Extract values from the observation
    const value = observation.valueQuantity?.value || 0;
    const unit = observation.valueQuantity?.unit || '';
    const timestamp = new Date(observation.effectiveDateTime || new Date());
    const notes = observation.note?.map((n: any) => n.text).join('\n') || null;
    
    // Determine if the value is abnormal based on reference ranges
    const isAbnormal = this.isValueAbnormal(value, metricType, observation.referenceRange);
    
    // Create the health metric object
    const healthMetric: IHealthMetric = {
      id: observation.id,
      userId: patientId,
      type: metricType,
      value,
      unit,
      timestamp,
      source: MetricSource.FHIR,
      notes,
      trend: null, // Trend calculation would be done elsewhere
      isAbnormal
    };
    
    return healthMetric;
  }
  
  /**
   * Determines if a metric value is abnormal based on reference ranges.
   * 
   * @param value - The metric value
   * @param metricType - The type of metric
   * @param referenceRanges - Optional reference ranges from FHIR
   * @returns True if the value is abnormal, false otherwise
   * @private
   */
  private isValueAbnormal(value: number, metricType: MetricType, referenceRanges?: any[]): boolean {
    // If reference ranges are provided in the FHIR response, use them
    if (referenceRanges && referenceRanges.length > 0) {
      for (const range of referenceRanges) {
        const low = range.low?.value;
        const high = range.high?.value;
        
        if ((low !== undefined && value < low) || (high !== undefined && value > high)) {
          return true;
        }
      }
      return false;
    }
    
    // Otherwise, use predefined normal ranges based on metric type
    const normalRanges: Record<MetricType, { min: number; max: number }> = {
      [MetricType.HEART_RATE]: { min: 60, max: 100 }, // bpm
      [MetricType.BLOOD_PRESSURE]: { min: 90, max: 120 }, // systolic, simplified
      [MetricType.BLOOD_GLUCOSE]: { min: 70, max: 140 }, // mg/dL
      [MetricType.WEIGHT]: { min: 0, max: Infinity }, // no upper limit
      [MetricType.HEIGHT]: { min: 0, max: Infinity }, // no upper limit
      [MetricType.STEPS]: { min: 0, max: Infinity }, // no upper limit
      [MetricType.TEMPERATURE]: { min: 36.1, max: 37.2 }, // Celsius
      [MetricType.OXYGEN_SATURATION]: { min: 95, max: 100 }, // percentage
      [MetricType.RESPIRATORY_RATE]: { min: 12, max: 20 }, // breaths per minute
      [MetricType.SLEEP]: { min: 7, max: 9 }, // hours
      [MetricType.ACTIVITY]: { min: 0, max: Infinity }, // no upper limit
      [MetricType.CALORIES]: { min: 0, max: Infinity } // no upper limit
    };
    
    const range = normalRanges[metricType];
    if (!range) return false;
    
    return value < range.min || value > range.max;
  }
}
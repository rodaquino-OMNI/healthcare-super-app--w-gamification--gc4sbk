import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

import { health } from '@app/health/config/configuration';
import { HealthMetric } from '@app/health/health/entities/health-metric.entity';
import { MedicalEvent } from '@app/health/health/entities/medical-event.entity';
import { LoggerService } from '@app/shared/logging/logger.service';
import { FHIRAdapter } from '@app/health/integrations/fhir/fhir.adapter';

import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { IMedicalEvent } from '@austa/interfaces/journey/health';
import { IBaseEvent } from '@austa/interfaces/events';
import { ExternalApiError, ExternalResponseFormatError } from '@austa/errors/categories';
import { validateFhirResource } from '@app/health/utils/fhir-validation.util';

/**
 * Handles the retrieval of patient data from FHIR-compliant systems and emits events when new data is available.
 * 
 * Addresses requirements:
 * - F-101: Integrates with external health record systems
 * - F-103-RQ-001: Retrieves and processes medical events for Medical History View
 */
@Injectable()
export class FhirService {
  private readonly config: Record<string, any>;

  /**
   * Initializes the FhirService.
   * 
   * @param fhirAdapter - The adapter for communicating with FHIR-compliant systems
   * @param logger - Logger service for consistent logging
   * @param eventEmitter - Event emitter for publishing data retrieval events
   */
  constructor(
    private readonly fhirAdapter: FHIRAdapter,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2
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
    // Log the retrieval attempt
    this.logger.log(`Retrieving patient record for patient ID: ${patientId}`, 'FhirService');
    
    try {
      // Call the FHIR adapter to retrieve the patient record
      const patientRecord = await this.fhirAdapter.getPatientRecord(patientId);
      
      // Validate the patient record
      validateFhirResource(patientRecord, 'Patient');
      
      // Emit a 'patient.record.retrieved' event with the patient data
      const event: IBaseEvent<any> = {
        eventId: `patient-record-${patientId}-${Date.now()}`,
        timestamp: new Date(),
        version: '1.0',
        source: 'health-service',
        type: 'patient.record.retrieved',
        payload: {
          patientId,
          data: patientRecord,
          timestamp: new Date()
        },
        metadata: {
          correlationId: `patient-${patientId}`,
          journeyType: 'health'
        }
      };
      
      this.eventEmitter.emit('patient.record.retrieved', event);
      
      // Return the patient record
      return patientRecord;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve patient record for patient ID: ${patientId}`,
        error.stack,
        'FhirService'
      );
      
      if (error instanceof ExternalApiError || error instanceof ExternalResponseFormatError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Failed to retrieve patient record',
        {
          patientId,
          errorCode: 'HEALTH_004',
          originalError: error
        }
      );
    }
  }

  /**
   * Retrieves a patient's medical history from a FHIR-compliant system.
   * 
   * @param patientId - The unique identifier of the patient
   * @returns A promise that resolves to an array of medical events
   */
  async getMedicalHistory(patientId: string): Promise<IMedicalEvent[]> {
    // Log the medical history retrieval attempt
    this.logger.log(`Retrieving medical history for patient ID: ${patientId}`, 'FhirService');
    
    try {
      // Call the FHIR adapter to retrieve the medical history
      const medicalEvents = await this.fhirAdapter.getMedicalHistory(patientId);
      
      // Validate each medical event
      medicalEvents.forEach(event => {
        if (!event.id || !event.type || !event.date) {
          throw new ExternalResponseFormatError(
            'Invalid medical event data received from FHIR API',
            {
              patientId,
              errorCode: 'HEALTH_008',
              invalidEvent: event
            }
          );
        }
      });
      
      // Emit a 'medical.history.retrieved' event with the medical events
      const event: IBaseEvent<any> = {
        eventId: `medical-history-${patientId}-${Date.now()}`,
        timestamp: new Date(),
        version: '1.0',
        source: 'health-service',
        type: 'medical.history.retrieved',
        payload: {
          patientId,
          events: medicalEvents,
          count: medicalEvents.length,
          timestamp: new Date()
        },
        metadata: {
          correlationId: `patient-${patientId}`,
          journeyType: 'health'
        }
      };
      
      this.eventEmitter.emit('medical.history.retrieved', event);
      
      // Return the array of medical events
      return medicalEvents;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve medical history for patient ID: ${patientId}`,
        error.stack,
        'FhirService'
      );
      
      if (error instanceof ExternalApiError || error instanceof ExternalResponseFormatError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Failed to retrieve medical history',
        {
          patientId,
          errorCode: 'HEALTH_005',
          originalError: error
        }
      );
    }
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
    dateRange?: { start: Date; end: Date }
  ): Promise<IHealthMetric[]> {
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
        ...(dateRange ? { 
          date: `ge${dateRange.start.toISOString()}&date=le${dateRange.end.toISOString()}` 
        } : {})
      };
      
      // Call the FHIR adapter to retrieve the health metrics
      // In a real implementation, this would call an appropriate method on the adapter
      // For now, we'll simulate the response with an empty array
      const observations: any[] = []; // Placeholder for actual implementation
      
      // Validate each observation
      observations.forEach(obs => {
        validateFhirResource(obs, 'Observation');
      });
      
      // Transform the FHIR observations into the internal HealthMetric format
      const metrics = observations.map(obs => 
        this.transformObservationToMetric(obs, patientId, metricType)
      );
      
      // Emit a 'health.metrics.retrieved' event with the health metrics
      const event: IBaseEvent<any> = {
        eventId: `health-metrics-${patientId}-${metricType}-${Date.now()}`,
        timestamp: new Date(),
        version: '1.0',
        source: 'health-service',
        type: 'health.metrics.retrieved',
        payload: {
          patientId,
          metricType,
          metrics,
          count: metrics.length,
          timestamp: new Date()
        },
        metadata: {
          correlationId: `patient-${patientId}`,
          journeyType: 'health'
        }
      };
      
      this.eventEmitter.emit('health.metrics.retrieved', event);
      
      // Return the array of health metrics
      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve health metrics of type ${metricType} for patient ID: ${patientId}`,
        error.stack,
        'FhirService'
      );
      
      if (error instanceof ExternalApiError || error instanceof ExternalResponseFormatError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Failed to retrieve health metrics',
        {
          patientId,
          metricType,
          errorCode: 'HEALTH_006',
          originalError: error
        }
      );
    }
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
      [MetricType.SLEEP]: '93830-5', // LOINC code for sleep duration
      [MetricType.BODY_FAT]: '41982-0', // LOINC code for body fat percentage
      [MetricType.BMI]: '39156-5' // LOINC code for body mass index
    };
    
    return codeMap[metricType] || metricType.toString();
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
    // Validate the observation structure
    if (!observation || !observation.valueQuantity) {
      throw new ExternalResponseFormatError(
        'Invalid FHIR Observation format',
        {
          patientId,
          metricType,
          errorCode: 'HEALTH_009',
          observation
        }
      );
    }
    
    // Extract the value and unit from the observation
    const value = observation.valueQuantity?.value || 0;
    const unit = observation.valueQuantity?.unit || '';
    
    // Extract the timestamp from the observation
    const timestamp = observation.effectiveDateTime 
      ? new Date(observation.effectiveDateTime) 
      : new Date();
    
    // Extract notes if available
    const notes = observation.note
      ? observation.note.map((n: any) => n.text).join('\n')
      : null;
    
    // Create a new health metric
    const metric: IHealthMetric = {
      id: observation.id || `${patientId}-${metricType}-${timestamp.getTime()}`,
      userId: patientId,
      type: metricType,
      value,
      unit,
      timestamp,
      source: MetricSource.FHIR,
      notes,
      trend: null, // This would be calculated based on previous measurements
      isAbnormal: this.isMetricAbnormal(metricType, value)
    };
    
    return metric;
  }
  
  /**
   * Determines if a metric value is abnormal based on standard reference ranges.
   * 
   * @param metricType - The type of health metric
   * @param value - The value to check
   * @returns True if the value is outside normal range, false otherwise
   * @private
   */
  private isMetricAbnormal(metricType: MetricType, value: number): boolean {
    // This is a simplified implementation
    // A real implementation would use more sophisticated reference ranges
    // possibly personalized to the patient's age, gender, and medical history
    switch (metricType) {
      case MetricType.HEART_RATE:
        return value < 60 || value > 100; // bpm
      case MetricType.BLOOD_PRESSURE:
        // For blood pressure, this is oversimplified
        // A real implementation would check both systolic and diastolic
        return value > 140; // mmHg (systolic)
      case MetricType.BLOOD_GLUCOSE:
        return value < 70 || value > 140; // mg/dL
      case MetricType.TEMPERATURE:
        return value < 36.1 || value > 37.8; // Celsius
      case MetricType.OXYGEN_SATURATION:
        return value < 95; // percentage
      case MetricType.RESPIRATORY_RATE:
        return value < 12 || value > 20; // breaths per minute
      default:
        return false; // No abnormality check for other metrics
    }
  }
}
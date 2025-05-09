import { BusinessError } from '../../categories/business.errors';
import { ErrorType } from '../../types';

/**
 * Error thrown when there's an issue with appointments
 */
export class AppointmentError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'APPOINTMENT_ERROR',
      details
    );
    this.name = 'AppointmentError';
  }
}

/**
 * Error thrown when there's an issue with providers
 */
export class ProviderError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'PROVIDER_ERROR',
      details
    );
    this.name = 'ProviderError';
  }
}

/**
 * Error thrown when there's an issue with telemedicine
 */
export class TelemedicineError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'TELEMEDICINE_ERROR',
      details
    );
    this.name = 'TelemedicineError';
  }
}

/**
 * Error thrown when there's an issue with medications
 */
export class MedicationError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'MEDICATION_ERROR',
      details
    );
    this.name = 'MedicationError';
  }
}

/**
 * Error thrown when there's an issue with treatments
 */
export class TreatmentError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'TREATMENT_ERROR',
      details
    );
    this.name = 'TreatmentError';
  }
}

export * from './types';
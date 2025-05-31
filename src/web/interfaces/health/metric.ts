/**
 * @file Health Metric Interface
 * @description Defines the HealthMetric interface and its corresponding Zod validation schema for the AUSTA SuperApp.
 * This interface represents individual health measurements like blood pressure, glucose levels, and weight.
 */

import { z } from 'zod'; // v3.22.4
import { HealthMetricType } from './types';
import { idSchema, dateSchema } from '../common/validation';
import { Nullable } from '../common/types';

/**
 * Represents a single health metric measurement
 * 
 * @remarks
 * Health metrics are the core data structure for the Health Journey, representing
 * individual measurements of various health indicators. These metrics can be
 * manually entered by users or automatically synced from connected devices.
 * 
 * @example
 * ```typescript
 * // Example of a heart rate measurement
 * const heartRateMetric: HealthMetric = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   type: HealthMetricType.HEART_RATE,
 *   value: 72,
 *   unit: 'bpm',
 *   timestamp: '2023-04-15T14:30:00Z',
 *   source: 'manual',
 * };
 * ```
 */
export interface HealthMetric {
  /**
   * Unique identifier for the health metric
   * Generated as a UUID when the metric is created
   */
  id: string;
  
  /**
   * Identifier of the user who owns this health metric
   * Links the metric to a specific user account
   */
  userId: string;
  
  /**
   * Type of health metric being recorded
   * Determines how the value is interpreted and displayed
   * 
   * @see HealthMetricType for available metric types
   */
  type: HealthMetricType;
  
  /**
   * Numerical value of the health metric
   * Interpretation depends on the metric type and unit
   * 
   * @example
   * - For HEART_RATE: beats per minute (e.g., 72)
   * - For BLOOD_PRESSURE: systolic value (e.g., 120)
   * - For BLOOD_GLUCOSE: glucose level (e.g., 95)
   * - For STEPS: number of steps (e.g., 8000)
   * - For SLEEP: minutes of sleep (e.g., 480)
   * - For WEIGHT: weight in specified unit (e.g., 70.5)
   */
  value: number;
  
  /**
   * Secondary value for metrics that require multiple values
   * Currently only used for BLOOD_PRESSURE (diastolic value)
   */
  secondaryValue?: Nullable<number>;
  
  /**
   * Unit of measurement for the health metric
   * Provides context for interpreting the value
   * 
   * @example
   * - For HEART_RATE: "bpm" (beats per minute)
   * - For BLOOD_PRESSURE: "mmHg" (millimeters of mercury)
   * - For BLOOD_GLUCOSE: "mg/dL" or "mmol/L"
   * - For STEPS: "passos" (steps)
   * - For SLEEP: "min" (minutes)
   * - For WEIGHT: "kg" (kilograms) or "lb" (pounds)
   */
  unit: string;
  
  /**
   * ISO 8601 timestamp when the measurement was taken
   * Format: YYYY-MM-DDTHH:mm:ssZ
   */
  timestamp: string;
  
  /**
   * Source of the health metric data
   * Indicates how the data was collected
   * 
   * @example
   * - "manual": Manually entered by the user
   * - "fitbit": Synced from a Fitbit device
   * - "apple_health": Imported from Apple Health
   * - "google_fit": Imported from Google Fit
   * - "garmin": Synced from a Garmin device
   * - "withings": Synced from a Withings device
   */
  source: string;
  
  /**
   * Optional notes provided by the user about this measurement
   * Can contain contextual information or observations
   */
  notes?: Nullable<string>;
}

/**
 * Zod schema for validating health metric data
 * 
 * @remarks
 * This schema ensures data consistency for health metric visualization
 * and processing. It validates all properties of a health metric according
 * to their expected types and formats.
 * 
 * @example
 * ```typescript
 * // Validating a health metric
 * const result = healthMetricSchema.safeParse(metricData);
 * if (result.success) {
 *   // Data is valid, use result.data
 *   const validMetric = result.data;
 * } else {
 *   // Handle validation errors
 *   console.error(result.error);
 * }
 * ```
 */
export const healthMetricSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: z.nativeEnum(HealthMetricType, {
    errorMap: () => ({ message: 'Tipo de métrica inválido' }),
  }),
  value: z.number({
    required_error: 'Valor é obrigatório',
    invalid_type_error: 'Valor deve ser um número',
  }),
  secondaryValue: z.number({
    invalid_type_error: 'Valor secundário deve ser um número',
  }).nullable().optional(),
  unit: z.string({
    required_error: 'Unidade é obrigatória',
    invalid_type_error: 'Unidade deve ser um texto',
  }),
  timestamp: dateSchema,
  source: z.string({
    required_error: 'Fonte é obrigatória',
    invalid_type_error: 'Fonte deve ser um texto',
  }),
  notes: z.string({
    invalid_type_error: 'Notas devem ser um texto',
  }).nullable().optional(),
});

/**
 * Type for creating a new health metric
 * Omits the id field which will be generated
 */
export type CreateHealthMetricInput = Omit<HealthMetric, 'id'>;

/**
 * Zod schema for validating health metric creation input
 */
export const createHealthMetricSchema = healthMetricSchema.omit({ id: true });

/**
 * Type for updating an existing health metric
 * Makes all fields optional except id
 */
export type UpdateHealthMetricInput = Pick<HealthMetric, 'id'> & Partial<Omit<HealthMetric, 'id' | 'userId' | 'type'>>;

/**
 * Zod schema for validating health metric update input
 */
export const updateHealthMetricSchema = z.object({
  id: idSchema,
}).and(
  healthMetricSchema.omit({ id: true, userId: true, type: true }).partial()
);

/**
 * Type for querying health metrics
 */
export interface HealthMetricQuery {
  userId?: string;
  type?: HealthMetricType;
  startDate?: string;
  endDate?: string;
  source?: string;
}

/**
 * Zod schema for validating health metric queries
 */
export const healthMetricQuerySchema = z.object({
  userId: idSchema.optional(),
  type: z.nativeEnum(HealthMetricType).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  source: z.string().optional(),
}).refine(
  data => !(data.startDate && data.endDate) || new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'A data inicial deve ser anterior à data final',
    path: ['startDate'],
  }
);
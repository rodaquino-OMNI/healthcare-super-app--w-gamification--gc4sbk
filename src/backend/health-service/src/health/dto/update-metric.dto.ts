import { IsNumber, IsOptional, IsString } from 'class-validator'; // v0.14.0+

/**
 * Data Transfer Object for updating a health metric.
 * This DTO defines the properties that can be updated for a health metric.
 * Used when making partial updates to existing metrics through PATCH requests.
 * Implements requirement F-101-RQ-002: Structure for health metrics updates.
 */
export class UpdateMetricDto {
  /**
   * The numeric value of the health metric
   * @example 120 (for systolic blood pressure)
   * @example 98.6 (for body temperature in Fahrenheit)
   * @example 6.2 (for blood glucose in mmol/L)
   */
  @IsNumber()
  @IsOptional()
  value?: number;

  /**
   * The unit of measurement for the health metric
   * @example 'mmHg' (for blood pressure)
   * @example 'bpm' (for heart rate)
   * @example 'kg' (for weight)
   * @example 'mmol/L' (for blood glucose)
   */
  @IsString()
  @IsOptional()
  unit?: string;

  /**
   * Additional notes or context for the health metric
   * @example 'Measured after exercise'
   * @example 'Fasting measurement'
   * @example 'Feeling lightheaded during measurement'
   * @example 'Taken with home device'
   */
  @IsString()
  @IsOptional()
  notes?: string;
}
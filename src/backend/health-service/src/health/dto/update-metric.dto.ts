import { IsNumber, IsOptional, IsString } from '@nestjs/class-validator'; // Updated for NestJS 10.3.0 compatibility

/**
 * Data transfer object for updating a health metric.
 * This DTO defines the properties that can be updated for a health metric.
 * Used when making partial updates to existing metrics through the Health API.
 * 
 * All fields are optional to allow for partial updates of specific properties
 * without requiring the entire object to be sent.
 */
export class UpdateMetricDto {
  /**
   * The numeric value of the health metric
   * @example 120 (for systolic blood pressure)
   * @example 98.6 (for body temperature in Fahrenheit)
   * @example 72 (for resting heart rate in BPM)
   */
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @IsOptional()
  value?: number;

  /**
   * The unit of measurement for the health metric
   * @example 'mmHg' (for blood pressure)
   * @example 'kg' (for weight)
   * @example 'mg/dL' (for blood glucose)
   */
  @IsString()
  @IsOptional()
  unit?: string;

  /**
   * Additional notes or context for the health metric
   * @example 'Measured after exercise'
   * @example 'Fasting measurement before breakfast'
   * @example 'Taken during illness'
   */
  @IsString()
  @IsOptional()
  notes?: string;
}
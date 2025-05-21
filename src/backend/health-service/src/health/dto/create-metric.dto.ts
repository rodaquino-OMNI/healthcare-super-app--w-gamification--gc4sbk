import { IsNotEmpty, IsNumber, IsString, IsDate, IsEnum, IsOptional } from 'class-validator'; // v0.14.0+ for NestJS 10.3.0
import { MetricType, MetricSource } from '@austa/interfaces/health';

/**
 * Data Transfer Object for creating a new health metric.
 * 
 * This DTO validates the input data required to create a health metric entry in the Health journey.
 * It ensures all required fields are present and properly typed before processing the metric.
 * 
 * @remarks
 * Implements requirement F-101-RQ-001: Structure for health metrics input.
 * Uses standardized enums from @austa/interfaces package for consistent type definitions.
 */
export class CreateMetricDto {
  /**
   * Type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE, etc.)
   * Must be one of the predefined MetricType enum values.
   */
  @IsNotEmpty()
  @IsEnum(MetricType)
  type: MetricType;

  /**
   * Numeric value of the health metric
   * Represents the actual measurement value (e.g., 72 for heart rate)
   */
  @IsNotEmpty()
  @IsNumber()
  value: number;

  /**
   * Unit of measurement for the health metric
   * Examples: 'bpm' for heart rate, 'mmHg' for blood pressure, 'kg' for weight
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * Timestamp when the metric was recorded
   * Used for tracking metrics over time and generating time-series visualizations
   */
  @IsNotEmpty()
  @IsDate()
  timestamp: Date;

  /**
   * Source of the health metric data
   * Indicates how the data was collected (e.g., MANUAL, DEVICE, API)
   * Must be one of the predefined MetricSource enum values.
   */
  @IsNotEmpty()
  @IsEnum(MetricSource)
  source: MetricSource;

  /**
   * Optional notes or comments about the health metric
   * Can be used to provide additional context about the measurement
   */
  @IsOptional()
  @IsString()
  notes: string | null;
}
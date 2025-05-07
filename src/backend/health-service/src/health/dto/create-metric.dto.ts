import { IsNotEmpty, IsNumber, IsString, IsDate, IsEnum, IsOptional } from 'class-validator'; // v0.14.0+
import { MetricType, MetricSource } from '@austa/interfaces/health';

/**
 * Data Transfer Object for creating a new health metric.
 * This DTO validates the input data required to create a health metric entry in the Health journey.
 * It ensures all required fields are present and properly formatted before processing.
 * 
 * Implements requirement F-101-RQ-001: Structure for health metrics input.
 * 
 * @example
 * ```typescript
 * const metricDto = new CreateMetricDto();
 * metricDto.type = MetricType.HEART_RATE;
 * metricDto.value = 72;
 * metricDto.unit = 'bpm';
 * metricDto.timestamp = new Date();
 * metricDto.source = MetricSource.DEVICE;
 * ```
 */
export class CreateMetricDto {
  /**
   * Type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE, etc.)
   * Must be one of the predefined MetricType enum values from @austa/interfaces
   */
  @IsNotEmpty()
  @IsEnum(MetricType)
  type: MetricType;

  /**
   * Numeric value of the health metric
   * Must be a valid number representing the measurement value
   */
  @IsNotEmpty()
  @IsNumber()
  value: number;

  /**
   * Unit of measurement for the health metric (e.g., bpm, mmHg, etc.)
   * Must be a string representing the standard unit for the given metric type
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * Timestamp when the metric was recorded
   * Must be a valid Date object representing when the measurement was taken
   */
  @IsNotEmpty()
  @IsDate()
  timestamp: Date;

  /**
   * Source of the health metric data (e.g., MANUAL, DEVICE, API)
   * Must be one of the predefined MetricSource enum values from @austa/interfaces
   */
  @IsNotEmpty()
  @IsEnum(MetricSource)
  source: MetricSource;

  /**
   * Optional notes or comments about the health metric
   * Can be used to provide additional context about the measurement
   * or circumstances under which it was recorded
   */
  @IsOptional()
  @IsString()
  notes: string | null;
}
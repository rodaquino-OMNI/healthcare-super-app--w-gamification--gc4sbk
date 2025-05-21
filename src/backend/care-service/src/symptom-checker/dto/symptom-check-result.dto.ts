import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * Represents the severity level of the symptom check result.
 * Used to categorize the urgency of the medical condition.
 */
export enum SymptomSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Represents a possible medical condition based on the symptoms provided.
 * Includes confidence level and description to help users understand the potential diagnosis.
 */
export class PossibleConditionDto {
  /**
   * The name of the possible medical condition.
   */
  @Expose()
  @IsString()
  name: string;

  /**
   * Confidence level for this condition based on the symptoms provided.
   * Value between 0 and 1, where 1 represents 100% confidence.
   */
  @Expose()
  @IsNumber()
  confidence: number;

  /**
   * Brief description of the medical condition.
   */
  @Expose()
  @IsString()
  description: string;
}

/**
 * Represents care options recommended based on the symptom check.
 * Indicates whether emergency care, appointment, or telemedicine is recommended.
 */
export class CareOptionDto {
  /**
   * Indicates if emergency medical attention is recommended.
   */
  @Expose()
  @IsBoolean()
  emergency: boolean;

  /**
   * Indicates if an in-person appointment is recommended.
   */
  @Expose()
  @IsBoolean()
  appointmentRecommended: boolean;

  /**
   * Indicates if a telemedicine consultation is recommended.
   */
  @Expose()
  @IsBoolean()
  telemedicineRecommended: boolean;
}

/**
 * Data Transfer Object for symptom check results.
 * Represents the analysis results of the submitted symptoms, including possible conditions,
 * confidence levels, and recommended next steps.
 * 
 * This DTO ensures consistent response structure for frontend consumption across
 * all Care Journey endpoints related to symptom checking.
 */
export class SymptomCheckResultDto {
  /**
   * The severity level of the symptoms based on analysis.
   * Used to determine urgency of care needed.
   */
  @Expose()
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  /**
   * Guidance text providing recommendations based on the symptom analysis.
   */
  @Expose()
  @IsString()
  guidance: string;

  /**
   * Care options recommended based on the symptom analysis.
   */
  @Expose()
  @ValidateNested()
  @Type(() => CareOptionDto)
  careOptions: CareOptionDto;

  /**
   * List of possible medical conditions based on the symptoms provided.
   * May be empty if no conditions could be determined with sufficient confidence.
   */
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PossibleConditionDto)
  @IsOptional()
  possibleConditions?: PossibleConditionDto[];

  /**
   * Emergency contact number to call if symptoms are severe.
   * Only provided when emergency care is recommended.
   */
  @Expose()
  @IsString()
  @IsOptional()
  emergencyNumber?: string;

  /**
   * Name of the external provider that performed the symptom analysis.
   * Only provided when an external service was used for analysis.
   */
  @Expose()
  @IsString()
  @IsOptional()
  externalProviderName?: string;
}
import { Expose, Type, Transform, plainToInstance } from 'class-transformer';
import { IsEnum, IsString, IsBoolean, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import {
  SymptomSeverity,
  CareOptions,
  PossibleCondition,
  SymptomCheckerResponse
} from '@austa/interfaces/journey/care/symptom-checker.interface';

/**
 * Data Transfer Object representing a possible medical condition based on symptom analysis.
 * Used for serializing condition data in the symptom checker response.
 */
export class PossibleConditionDto implements PossibleCondition {
  /**
   * Name of the possible condition.
   */
  @Expose()
  @IsString()
  name: string;

  /**
   * Confidence level for this condition (0.0 to 1.0).
   * Represents the probability that the condition matches the symptoms.
   */
  @Expose()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value.toFixed(2))) // Round to 2 decimal places
  confidence: number;

  /**
   * Brief description of the condition.
   */
  @Expose()
  @IsString()
  description: string;
}

/**
 * Data Transfer Object representing care options recommended based on symptom analysis.
 * Used for serializing care option data in the symptom checker response.
 */
export class CareOptionsDto implements CareOptions {
  /**
   * Indicates if emergency care is recommended.
   * When true, the user should seek immediate medical attention.
   */
  @Expose()
  @IsBoolean()
  @Transform(({ value }) => Boolean(value)) // Ensure boolean type
  emergency: boolean;

  /**
   * Indicates if an in-person appointment is recommended.
   * When true, the user should schedule an appointment with a healthcare provider.
   */
  @Expose()
  @IsBoolean()
  @Transform(({ value }) => Boolean(value)) // Ensure boolean type
  appointmentRecommended: boolean;

  /**
   * Indicates if a telemedicine consultation is recommended.
   * When true, the user should consider a virtual consultation with a healthcare provider.
   */
  @Expose()
  @IsBoolean()
  @Transform(({ value }) => Boolean(value)) // Ensure boolean type
  telemedicineRecommended: boolean;
}

/**
 * Data Transfer Object for symptom check results.
 * Used as the response payload from the symptom checker endpoint in the Care Now journey.
 * Implements the SymptomCheckerResponse interface from the shared interfaces package.
 * 
 * Part of the F-111 Symptom Checker feature for the Care Now journey.
 */
export class SymptomCheckResultDto implements SymptomCheckerResponse {
  /**
   * Assessed severity of the symptoms.
   * Determines the urgency of medical attention needed.
   */
  @Expose()
  @IsEnum(SymptomSeverity, {
    message: 'Severity must be one of: low, medium, high'
  })
  severity: SymptomSeverity;

  /**
   * Guidance text based on the symptom analysis.
   * Provides recommendations for the user based on their symptoms.
   */
  @Expose()
  @IsString()
  guidance: string;

  /**
   * Recommended care options based on the symptom analysis.
   * Indicates what type of medical attention is recommended.
   */
  @Expose()
  @ValidateNested()
  @Type(() => CareOptionsDto)
  careOptions: CareOptionsDto;

  /**
   * List of possible conditions that match the symptoms.
   * Optional as not all analyses will provide possible conditions.
   */
  @Expose()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PossibleConditionDto)
  possibleConditions?: PossibleConditionDto[];

  /**
   * Emergency contact number to call if symptoms are severe.
   * Only provided for high severity cases.
   */
  @Expose()
  @IsOptional()
  @IsString()
  emergencyNumber?: string;

  /**
   * Name of the external provider that performed the analysis.
   * Only provided when using an external symptom checking service.
   */
  @Expose()
  @IsOptional()
  @IsString()
  externalProviderName?: string;

  /**
   * Creates a new SymptomCheckResultDto instance from a SymptomCheckerResponse object.
   * Useful for converting service responses to DTOs.
   * 
   * @param response The SymptomCheckerResponse object to convert
   * @returns A new SymptomCheckResultDto instance
   */
  static fromResponse(response: SymptomCheckerResponse): SymptomCheckResultDto {
    return plainToInstance(SymptomCheckResultDto, response, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }
  
  /**
   * Creates a simplified version of the DTO with only essential information.
   * Useful for scenarios where bandwidth or payload size is a concern.
   * 
   * @returns A simplified version of the DTO with only essential fields
   */
  toSimplified(): Pick<SymptomCheckResultDto, 'severity' | 'guidance' | 'careOptions'> {
    return {
      severity: this.severity,
      guidance: this.guidance,
      careOptions: this.careOptions
    };
  }
  
  /**
   * Determines if the symptom check result indicates an emergency situation.
   * 
   * @returns True if the severity is HIGH or emergency care is recommended
   */
  isEmergency(): boolean {
    return this.severity === SymptomSeverity.HIGH || this.careOptions.emergency;
  }
  
  /**
   * Determines if the symptom check result recommends any form of medical attention.
   * 
   * @returns True if any form of medical attention is recommended
   */
  needsMedicalAttention(): boolean {
    return (
      this.severity !== SymptomSeverity.LOW ||
      this.careOptions.emergency ||
      this.careOptions.appointmentRecommended ||
      this.careOptions.telemedicineRecommended
    );
  }
  
  /**
   * Gets the recommended next steps based on the symptom check result.
   * Provides a user-friendly action plan based on the severity and care options.
   * 
   * @returns An array of recommended next steps as strings
   */
  getRecommendedNextSteps(): string[] {
    const nextSteps: string[] = [];
    
    if (this.careOptions.emergency) {
      nextSteps.push(`Seek immediate medical attention${this.emergencyNumber ? ` or call ${this.emergencyNumber}` : ''}`);
    } else if (this.severity === SymptomSeverity.HIGH) {
      nextSteps.push('Consult with a healthcare professional immediately');
    }
    
    if (this.careOptions.appointmentRecommended) {
      nextSteps.push('Schedule an in-person appointment with a healthcare provider');
    }
    
    if (this.careOptions.telemedicineRecommended) {
      nextSteps.push('Consider a telemedicine consultation for faster care');
    }
    
    if (nextSteps.length === 0) {
      nextSteps.push('Monitor your symptoms and rest');
      nextSteps.push('Contact a healthcare provider if symptoms worsen');
    }
    
    return nextSteps;
  }
  
  /**
   * Creates a standardized response object for the API.
   * Ensures consistent response format for frontend consumption.
   * 
   * @returns A standardized response object with status and data
   */
  toApiResponse(): { status: string; data: SymptomCheckResultDto } {
    return {
      status: 'success',
      data: this
    };
  }
}
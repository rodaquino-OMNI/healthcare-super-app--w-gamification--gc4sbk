/**
 * Format Template DTO
 * 
 * This DTO is used for formatting notification templates with dynamic data
 * by replacing placeholders in the template with actual values.
 * 
 * The formatting process replaces placeholders in the format {{variableName}}
 * with corresponding values from the data object. For example, if the template
 * contains "Hello {{userName}}", and the data object is {userName: "João"},
 * the formatted result will be "Hello João".
 * 
 * This DTO supports journey-specific template formatting with specialized
 * subclasses for health, care, and plan journeys, ensuring proper typing
 * and validation for each journey context.
 * 
 * @example
 * // Basic usage
 * const dto = new FormatTemplateDto();
 * dto.templateId = 'welcome-message';
 * dto.data = { userName: 'João Silva' };
 * 
 * // Journey-specific usage
 * const healthDto = new FormatHealthTemplateDto();
 * healthDto.templateId = 'health-goal-achieved';
 * healthDto.data = { 
 *   userName: 'João Silva',
 *   metricName: 'Passos',
 *   metricValue: '10,000',
 *   goalTarget: '8,000'
 * };
 */

import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Import interfaces from @austa/interfaces package using path aliases
import { IHealthMetric } from '@austa/interfaces/journey/health';
import { IAppointment } from '@austa/interfaces/journey/care';
import { IClaim, IBenefit } from '@austa/interfaces/journey/plan';
import { IJourneySpecificPayload } from '@austa/interfaces/notification';

/**
 * Custom validator to ensure that all required template placeholders have values in the data object.
 * This validator requires access to the template content, which is typically retrieved from the database.
 */
@ValidatorConstraint({ name: 'templatePlaceholdersValidator', async: true })
@Injectable()
export class TemplatePlaceholdersValidator implements ValidatorConstraintInterface {
  /**
   * Validates that all placeholders in a template have corresponding values in the data object.
   * 
   * @param value The data object to validate
   * @param args Validation arguments containing template content
   * @returns true if all placeholders have values, false otherwise
   */
  async validate(value: Record<string, any>, args: ValidationArguments): Promise<boolean> {
    // This is a placeholder implementation since the actual template content
    // would need to be retrieved from the database or passed in context
    // In a real implementation, this would be injected with the TemplatesService
    
    // For now, we'll just check that the data object is not empty
    return value && Object.keys(value).length > 0;
  }

  /**
   * Returns the default error message when validation fails.
   * 
   * @param args Validation arguments
   * @returns Error message string
   */
  defaultMessage(args: ValidationArguments): string {
    return 'The data object is missing values for required template placeholders';
  }
}
import { ValidationPipe, ValidationPipeOptions, Injectable } from '@nestjs/common';

/**
 * DTO for formatting a notification template with dynamic data.
 * Used by the formatTemplateWithData() method in templates.service.ts.
 */
export class FormatTemplateDto {
  /**
   * The unique identifier of the template to format.
   * This ID is used to retrieve the template from the database.
   * 
   * @example 'appointment-reminder'
   */
  @ApiProperty({
    description: 'The unique identifier of the template to format',
    example: 'appointment-reminder',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  /**
   * Optional language code to specify which language version of the template to use.
   * If not provided, the user's preferred language or system default will be used.
   * 
   * @example 'pt-BR'
   */
  @ApiProperty({
    description: 'Language code for the template (e.g., pt-BR, en-US)',
    example: 'pt-BR',
    required: false
  })
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * The journey context for the notification.
   * Used to retrieve journey-specific templates when available.
   * 
   * @example 'health'
   */
  @ApiProperty({
    description: 'Journey context for the notification',
    example: 'health',
    enum: ['health', 'care', 'plan'],
    required: false
  })
  @IsString()
  @IsOptional()
  journey?: string;

  /**
   * Data object containing values to replace placeholders in the template.
   * Keys in this object correspond to placeholder names in the template.
   * 
   * For example, if the template contains "{{userName}}", the data object
   * should contain a "userName" property with the value to substitute.
   * 
   * @example { userName: 'João Silva', appointmentTime: '14:00', providerName: 'Dr. Ana Costa' }
   */
  @ApiProperty({
    description: 'Data object containing values to replace placeholders in the template',
    example: { userName: 'João Silva', appointmentTime: '14:00', providerName: 'Dr. Ana Costa' },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  @Validate(TemplatePlaceholdersValidator)
  data: Record<string, any>;
}

/**
 * Extended DTO for formatting a notification template with journey-specific data.
 * Provides stronger typing for different journey contexts.
 */
export class FormatTemplateWithJourneyDto extends FormatTemplateDto {
  /**
   * Data object with journey-specific structure based on the journey context.
   * This provides better type safety for journey-specific template data.
   */
  @ApiProperty({
    description: 'Journey-specific data for template placeholders',
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  declare data: Record<string, any> | Partial<IJourneySpecificPayload>;
}

/**
 * DTO for health journey template formatting.
 * Contains specific fields relevant to health notifications.
 */
export class FormatHealthTemplateDto extends FormatTemplateWithJourneyDto {
  /**
   * The journey context is always 'health' for this DTO.
   */
  @ApiProperty({
    description: 'Journey context (always "health" for this DTO)',
    example: 'health',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  journey: 'health' = 'health';

  /**
   * Health-specific data structure for template placeholders.
   */
  @ApiProperty({
    description: 'Health-specific data for template placeholders',
    example: {
      userName: 'João Silva',
      metricName: 'Passos',
      metricValue: '10,000',
      goalTarget: '8,000',
      achievementPercentage: '125%'
    },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  declare data: Record<string, any> & {
    metricName?: string;
    metricValue?: string | number;
    goalTarget?: string | number;
    achievementPercentage?: string;
    metric?: Partial<IHealthMetric>;
    goalId?: string;
    deviceId?: string;
    deepLink?: string;
    healthData?: Record<string, any>;
  };
}

/**
 * DTO for care journey template formatting.
 * Contains specific fields relevant to care notifications.
 */
export class FormatCareTemplateDto extends FormatTemplateWithJourneyDto {
  /**
   * The journey context is always 'care' for this DTO.
   */
  @ApiProperty({
    description: 'Journey context (always "care" for this DTO)',
    example: 'care',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  journey: 'care' = 'care';

  /**
   * Care-specific data structure for template placeholders.
   */
  @ApiProperty({
    description: 'Care-specific data for template placeholders',
    example: {
      userName: 'João Silva',
      providerName: 'Dr. Ana Costa',
      appointmentTime: '14:00',
      appointmentDate: '15/04/2023',
      appointmentLocation: 'Clínica Central'
    },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  declare data: Record<string, any> & {
    providerName?: string;
    appointmentTime?: string;
    appointmentDate?: string;
    appointmentLocation?: string;
    medicationName?: string;
    appointment?: Partial<IAppointment>;
    medicationId?: string;
    providerId?: string;
    deepLink?: string;
    careData?: Record<string, any>;
  };
}

/**
 * DTO for plan journey template formatting.
 * Contains specific fields relevant to plan notifications.
 */
export class FormatPlanTemplateDto extends FormatTemplateWithJourneyDto {
  /**
   * The journey context is always 'plan' for this DTO.
   */
  @ApiProperty({
    description: 'Journey context (always "plan" for this DTO)',
    example: 'plan',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  journey: 'plan' = 'plan';

  /**
   * Plan-specific data structure for template placeholders.
   */
  @ApiProperty({
    description: 'Plan-specific data for template placeholders',
    example: {
      userName: 'João Silva',
      planName: 'Plano Família Premium',
      claimId: 'CLM-12345',
      claimStatus: 'Aprovado',
      claimAmount: 'R$ 350,00',
      benefitName: 'Consulta Especialista'
    },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  declare data: Record<string, any> & {
    planName?: string;
    claimId?: string;
    claimStatus?: string;
    claimAmount?: string;
    benefitName?: string;
    claim?: Partial<IClaim>;
    benefit?: Partial<IBenefit>;
    planId?: string;
    deepLink?: string;
    planData?: Record<string, any>;
  };
}

/**
 * Configuration for the validation pipe used with template formatting DTOs.
 * Provides consistent validation behavior across the notification service.
 */
export const templateValidationConfig: ValidationPipeOptions = {
  /**
   * Automatically transform incoming data to the DTO instance type
   */
  transform: true,
  
  /**
   * Strip properties that are not defined in the DTO
   */
  whitelist: true,
  
  /**
   * Throw an error if non-whitelisted properties are present
   */
  forbidNonWhitelisted: true,
  
  /**
   * Validate nested objects
   */
  validateNested: true,
  
  /**
   * Throw an error if validation fails
   */
  disableErrorMessages: false,
  
  /**
   * Ensure all required properties are present
   */
  forbidUnknownValues: true,
  
  /**
   * Provide detailed error messages
   */
  validationError: {
    target: false,
    value: true,
  },
};

/**
 * Factory function to create a ValidationPipe instance for template formatting.
 * @returns A configured ValidationPipe instance
 */
export function createTemplateValidationPipe(): ValidationPipe {
  return new ValidationPipe(templateValidationConfig);
}

/**
 * Utility function to validate and extract template data from a FormatTemplateDto.
 * Ensures that all required placeholders have corresponding values in the data object.
 * 
 * @param template The template content with placeholders
 * @param data The data object with values for placeholders
 * @returns An object with validation result and missing placeholders if any
 */
export function validateTemplatePlaceholders(
  template: { title: string; body: string },
  data: Record<string, any>
): { isValid: boolean; missingPlaceholders: string[] } {
  // Extract all placeholders from the template using regex
  const titlePlaceholders = extractPlaceholders(template.title);
  const bodyPlaceholders = extractPlaceholders(template.body);
  
  // Combine all unique placeholders
  const allPlaceholders = [...new Set([...titlePlaceholders, ...bodyPlaceholders])];
  
  // Check if all placeholders have corresponding values in the data object
  const missingPlaceholders = allPlaceholders.filter(placeholder => {
    return data[placeholder] === undefined;
  });
  
  return {
    isValid: missingPlaceholders.length === 0,
    missingPlaceholders
  };
}

/**
 * Helper function to extract placeholders from a template string.
 * @param text The template text containing placeholders in the format {{placeholder}}
 * @returns Array of placeholder names without the curly braces
 * @private
 */
function extractPlaceholders(text: string): string[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const placeholders: string[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = placeholderRegex.exec(text)) !== null) {
    placeholders.push(match[1]);
  }
  
  return placeholders;
}

/**
 * Factory function to create the appropriate template formatting DTO based on journey context.
 * This simplifies handling different journey-specific template formats in controllers and services.
 * 
 * @param journey The journey context ('health', 'care', 'plan', or undefined for generic)
 * @param templateId The template identifier
 * @param data The data for template placeholders
 * @param language Optional language code
 * @returns The appropriate DTO instance for the specified journey
 */
export function createFormatTemplateDto(
  journey: string | undefined,
  templateId: string,
  data: Record<string, any>,
  language?: string
): FormatTemplateDto {
  // Create the base template data
  const baseData = {
    templateId,
    data,
    language,
    journey
  };
  
  // Return the appropriate journey-specific DTO based on the journey context
  switch (journey) {
    case 'health':
      return Object.assign(new FormatHealthTemplateDto(), baseData);
      
    case 'care':
      return Object.assign(new FormatCareTemplateDto(), baseData);
      
    case 'plan':
      return Object.assign(new FormatPlanTemplateDto(), baseData);
      
    default:
      return Object.assign(new FormatTemplateDto(), baseData);
  }
}
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyType } from '@austa/interfaces/journey';
import { NotificationTemplateData } from '@austa/interfaces/notification/templates';

/**
 * Data transfer object for formatting notification templates with dynamic data.
 * This DTO is used by the formatTemplateWithData() method in templates.service.ts
 * to replace placeholders in templates with actual values.
 */
export class FormatTemplateDto {
  /**
   * The unique identifier of the template to format.
   * This must match an existing templateId in the notification_templates table.
   * 
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @IsString()
  @IsNotEmpty({ message: 'Template identifier is required' })
  templateId: string;

  /**
   * The data object containing values to replace placeholders in the template.
   * Keys in this object should match the placeholder names in the template.
   * 
   * For example, if the template contains "{{userName}}", the data object
   * should have a "userName" property with the value to substitute.
   */
  @IsObject()
  @IsNotEmpty({ message: 'Template data is required' })
  data: NotificationTemplateData;

  /**
   * Optional language code to specify which language version of the template to use.
   * Follows ISO 639-1 with optional region (e.g., 'pt-BR', 'en-US').
   * 
   * If not provided, the service will attempt to find the best matching template
   * based on other criteria and default language settings.
   */
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * Optional journey context to specify which journey-specific template to use.
   * This helps in retrieving templates that are tailored for specific journeys
   * (Health, Care, Plan) within the AUSTA SuperApp.
   */
  @IsString()
  @IsOptional()
  journey?: JourneyType;

  /**
   * Creates a new instance of FormatTemplateDto with the provided values.
   * @param partial Partial data to initialize the DTO
   */
  constructor(partial?: Partial<FormatTemplateDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Validates that all required placeholders in the template have corresponding
   * values in the data object. This method is intended to be used by the service
   * after retrieving the actual template.
   * 
   * @param template The template content with placeholders
   * @returns True if all placeholders have corresponding data values
   */
  validatePlaceholders(template: string): boolean {
    // Extract all placeholders from the template using regex
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = new Set<string>();
    let match;
    
    while ((match = placeholderRegex.exec(template)) !== null) {
      placeholders.add(match[1]);
    }
    
    // Check if all placeholders have corresponding values in the data object
    for (const placeholder of placeholders) {
      if (this.data[placeholder] === undefined) {
        return false;
      }
    }
    
    return true;
  }
}
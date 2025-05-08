import { PartialType } from '@nestjs/mapped-types'; // @nestjs/mapped-types@1.2.0+
import { IsOptional, IsUUID } from 'class-validator'; // class-validator@0.14.0+

// Import from @austa packages for standardized interfaces
import { INotificationTemplate } from '@austa/interfaces/notification/templates';

// Import using path aliases for consistent imports
import { CreateNotificationTemplateDto } from './create-notification-template.dto';

/**
 * Data Transfer Object for updating an existing notification template.
 * Extends CreateNotificationTemplateDto but makes all fields optional using PartialType.
 * This allows for partial updates to templates while maintaining validation rules.
 * 
 * @example
 * // Update only the title of a template
 * {
 *   "title": "New Appointment Reminder Title"
 * }
 * 
 * @example
 * // Update multiple fields
 * {
 *   "title": "Achievement Unlocked",
 *   "body": "Congratulations! You've earned the {{achievementName}} achievement.",
 *   "channels": ["push", "in-app"]
 * }
 */
export class UpdateNotificationTemplateDto extends PartialType(CreateNotificationTemplateDto) implements Partial<INotificationTemplate> {
  /**
   * The unique identifier of the template to update.
   * This is required to identify which template to update.
   */
  @IsUUID()
  @IsOptional()
  id?: string;

  /**
   * Optional validation method that can be used to perform
   * custom validation specific to update operations.
   * 
   * @returns true if the update data is valid
   */
  validate(): boolean {
    // Ensure at least one field is being updated
    const updateFields = Object.keys(this).filter(key => 
      key !== 'id' && this[key] !== undefined
    );
    
    if (updateFields.length === 0) {
      return false;
    }
    
    // If channels is provided as an array, convert it to a JSON string
    if (this.channels && Array.isArray(this.channels)) {
      this.channels = JSON.stringify(this.channels) as any;
    }
    
    return true;
  }
  
  /**
   * Transforms the DTO to a format suitable for database update.
   * Handles conversion of arrays to JSON strings as needed.
   * 
   * @returns Object ready for database update
   */
  toEntity(): Partial<INotificationTemplate> {
    const entity: Partial<INotificationTemplate> = {};
    
    if (this.templateId !== undefined) entity.templateId = this.templateId;
    if (this.language !== undefined) entity.language = this.language;
    if (this.title !== undefined) entity.title = this.title;
    if (this.body !== undefined) entity.body = this.body;
    
    // Convert channels array to JSON string for database storage if present
    if (this.channels !== undefined) {
      entity.channels = Array.isArray(this.channels) 
        ? JSON.stringify(this.channels)
        : this.channels;
    }
    
    return entity;
  }
}
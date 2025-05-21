import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationTemplateDto } from './create-notification-template.dto';
import { NotificationTemplateInterface } from '@austa/interfaces/notification';

/**
 * Data Transfer Object for updating an existing notification template.
 * Makes all fields from CreateNotificationTemplateDto optional while preserving validation rules.
 * 
 * This DTO is used by the templates.service.ts update() method to ensure data integrity
 * during partial update operations.
 */
export class UpdateNotificationTemplateDto extends PartialType(CreateNotificationTemplateDto) implements Partial<NotificationTemplateInterface> {
  // All fields are inherited from CreateNotificationTemplateDto but made optional
  // PartialType preserves all validation decorators but makes them apply only when the field is present
}
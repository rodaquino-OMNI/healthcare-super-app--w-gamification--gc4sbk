import { IsUUID, IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationPriority } from '@austa/interfaces/notification/types';

/**
 * Data Transfer Object for sending a notification.
 * Validates the request body for the send notification endpoint.
 */
export class SendNotificationDto {
  /**
   * ID of the user who should receive the notification.
   */
  @ApiProperty({
    description: 'ID of the user who should receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification (e.g., 'appointment_reminder', 'achievement_unlocked').
   */
  @ApiProperty({
    description: 'Type of notification',
    example: 'appointment_reminder',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Title of the notification.
   * Required unless templateId is provided.
   */
  @ApiProperty({
    description: 'Title of the notification',
    example: 'Appointment Reminder',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Body content of the notification.
   * Required unless templateId is provided.
   */
  @ApiProperty({
    description: 'Body content of the notification',
    example: 'Your appointment with Dr. Smith is tomorrow at 2:00 PM.',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Optional data to include with the notification.
   * Can be used for template variables or additional context.
   */
  @ApiPropertyOptional({
    description: 'Optional data to include with the notification',
    example: { appointmentId: '12345', doctorName: 'Dr. Smith', time: '2:00 PM' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  /**
   * Optional template ID to use for formatting the notification.
   * If provided, title and body will be generated from the template.
   */
  @ApiPropertyOptional({
    description: 'Template ID to use for formatting the notification',
    example: 'appointment_reminder',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * Optional language code for the notification template.
   * Defaults to 'pt-BR' if not provided.
   */
  @ApiPropertyOptional({
    description: 'Language code for the notification template',
    example: 'pt-BR',
    default: 'pt-BR',
  })
  @IsOptional()
  @IsString()
  language?: string;

  /**
   * Optional priority level for the notification.
   * Affects delivery urgency and channel selection.
   */
  @ApiPropertyOptional({
    description: 'Priority level for the notification',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
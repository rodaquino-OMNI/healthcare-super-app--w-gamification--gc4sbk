import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Base Data Transfer Object for all notification events
 * Contains common properties that all notification events must have
 */
export class BaseNotificationEventDto {
  /**
   * Unique identifier for the notification event
   */
  @IsUUID(4)
  @IsNotEmpty()
  id: string;

  /**
   * User ID of the recipient for this notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Title displayed in the notification
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Main content of the notification
   */
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Timestamp when the notification event was created
   */
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Schema version for the notification event
   * Used for backward compatibility during schema evolution
   */
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  version: number = 1;

  /**
   * ID of the notification template to use (if applicable)
   */
  @IsString()
  @IsOptional()
  templateId?: string;

  /**
   * Language code for the notification content
   * Defaults to user's preferred language if not specified
   */
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * Additional metadata for the notification
   * Can include tracking information, source details, etc.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
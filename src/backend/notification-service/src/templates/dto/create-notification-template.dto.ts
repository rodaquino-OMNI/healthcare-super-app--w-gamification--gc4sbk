import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength, MinLength, IsIn, ArrayNotEmpty, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '@austa/interfaces/notification/types';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

/**
 * Data Transfer Object for creating a new notification template.
 * Used to validate incoming data when creating templates through the API.
 */
export class CreateNotificationTemplateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @ApiProperty({
    description: 'Unique identifier for the template',
    example: 'appointment-reminder',
  })
  @IsString({ message: 'Template ID must be a string' })
  @IsNotEmpty({ message: 'Template ID is required' })
  @MinLength(3, { message: 'Template ID must be at least 3 characters long' })
  @MaxLength(50, { message: 'Template ID must not exceed 50 characters' })
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   */
  @ApiProperty({
    description: 'Language code (ISO 639-1 with optional region)',
    example: 'pt-BR',
    default: 'pt-BR',
  })
  @IsString({ message: 'Language must be a string' })
  @IsNotEmpty({ message: 'Language is required' })
  @MaxLength(10, { message: 'Language code must not exceed 10 characters' })
  language: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   */
  @ApiProperty({
    description: 'Title of the notification with optional placeholders {{variableName}}',
    example: 'Lembrete de Consulta com {{providerName}}',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(150, { message: 'Title must not exceed 150 characters' })
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   */
  @ApiProperty({
    description: 'Body content of the notification with optional placeholders {{variableName}}',
    example: 'Sua consulta está agendada para {{appointmentTime}} amanhã.',
  })
  @IsString({ message: 'Body must be a string' })
  @IsNotEmpty({ message: 'Body is required' })
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   */
  @ApiProperty({
    description: 'Channels through which this notification can be delivered',
    example: ['in-app', 'push'],
    enum: Object.values(NotificationChannel),
    isArray: true,
    default: [NotificationChannel.IN_APP],
  })
  @IsArray({ message: 'Channels must be an array' })
  @ArrayNotEmpty({ message: 'At least one channel must be specified' })
  @IsIn(Object.values(NotificationChannel), { each: true, message: 'Invalid notification channel' })
  @Type(() => String)
  channels: string[];

  /**
   * Optional journey identifier to associate the template with a specific journey.
   * This helps in organizing and retrieving templates by journey context.
   */
  @ApiPropertyOptional({
    description: 'Journey identifier to associate the template with a specific journey',
    example: 'health',
    enum: Object.values(JOURNEY_IDS),
  })
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  @ValidateIf((o) => o.journey !== undefined && o.journey !== null)
  @IsIn(Object.values(JOURNEY_IDS), { message: 'Invalid journey identifier' })
  journey?: string;
}
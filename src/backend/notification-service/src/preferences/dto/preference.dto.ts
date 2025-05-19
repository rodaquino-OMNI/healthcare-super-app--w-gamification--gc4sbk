import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { INotificationPreference } from '@austa/interfaces/notification/preferences';

/**
 * DTO for creating a new notification preference
 */
export class CreatePreferenceDto implements Partial<INotificationPreference> {
  /**
   * The user ID associated with these notification preferences
   * References the user in the authentication system
   */
  @ApiProperty({
    description: 'User ID for the notification preference',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  userId: string;

  /**
   * Whether push notifications are enabled for this user
   * Default is true as push notifications are a primary notification channel
   */
  @ApiPropertyOptional({
    description: 'Whether push notifications are enabled',
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  /**
   * Whether email notifications are enabled for this user
   * Default is true for important communications
   */
  @ApiPropertyOptional({
    description: 'Whether email notifications are enabled',
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  /**
   * Whether SMS notifications are enabled for this user
   * Default is false due to potential costs associated with SMS
   */
  @ApiPropertyOptional({
    description: 'Whether SMS notifications are enabled',
    default: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;
}

/**
 * DTO for updating an existing notification preference
 */
export class UpdatePreferenceDto implements Partial<INotificationPreference> {
  /**
   * Whether push notifications are enabled for this user
   */
  @ApiPropertyOptional({
    description: 'Whether push notifications are enabled',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  /**
   * Whether email notifications are enabled for this user
   */
  @ApiPropertyOptional({
    description: 'Whether email notifications are enabled',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  /**
   * Whether SMS notifications are enabled for this user
   */
  @ApiPropertyOptional({
    description: 'Whether SMS notifications are enabled',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;
}

/**
 * DTO for retrieving notification preferences by user ID
 */
export class GetPreferenceByUserIdDto {
  /**
   * The user ID to retrieve preferences for
   */
  @ApiProperty({
    description: 'User ID to retrieve notification preferences for',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  userId: string;
}
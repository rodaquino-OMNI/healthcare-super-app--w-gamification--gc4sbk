import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * Represents an error entry in the retry history
 */
export class ErrorHistoryEntryDto {
  /**
   * Timestamp when the error occurred
   */
  @IsDate()
  @IsNotEmpty()
  timestamp: Date;

  /**
   * Error message
   */
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Error code or type identifier
   */
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Additional error context
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

/**
 * Data transfer object for retry operation status responses.
 * This DTO defines the structure of retry operations when returned through the API.
 * It includes all essential information about a retry operation including its status,
 * history, and scheduling details.
 */
export class RetryStatusResponseDto {
  /**
   * Unique identifier for the retry operation
   */
  @IsUUID(4)
  @IsNotEmpty()
  id: string;

  /**
   * ID of the notification being retried
   */
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   */
  @IsString()
  @IsNotEmpty()
  notificationType: string;

  /**
   * Current status of the retry operation
   */
  @IsEnum(RetryStatus)
  @IsNotEmpty()
  status: RetryStatus;

  /**
   * Number of retry attempts made so far
   */
  @IsInt()
  @IsPositive()
  attemptCount: number;

  /**
   * Maximum number of retry attempts allowed
   */
  @IsInt()
  @IsPositive()
  maxAttempts: number;

  /**
   * Timestamp when the retry operation was created
   */
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  /**
   * Timestamp when the retry operation was last updated
   */
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  /**
   * Timestamp for the next scheduled retry attempt
   * Only applicable for PENDING or FAILED status
   */
  @IsDate()
  @IsOptional()
  nextRetryTime?: Date;

  /**
   * History of errors encountered during retry attempts
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorHistoryEntryDto)
  errorHistory: ErrorHistoryEntryDto[];

  /**
   * Notification channel being used (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @IsString()
  @IsNotEmpty()
  channel: string;

  /**
   * Additional metadata for analytics and debugging
   * Can include error classification, delivery provider information, etc.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * User ID of the notification recipient
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Notification title
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * Brief summary of the current retry status
   * Provides a human-readable description of the current state
   */
  @IsString()
  @IsNotEmpty()
  statusSummary: string;
}
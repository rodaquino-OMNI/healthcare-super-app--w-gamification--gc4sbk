import { IsNotEmpty, IsString, IsObject, IsOptional, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for error details in a DLQ item
 */
export class ErrorDetailsDto {
  /**
   * Error message
   */
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Error stack trace
   */
  @IsString()
  @IsOptional()
  stack?: string;

  /**
   * Error name/type
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Details of any scheduling error that occurred
   */
  @IsObject()
  @IsOptional()
  schedulingError?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * DTO for retry history in a DLQ item
 */
export class RetryHistoryDto {
  /**
   * Number of retry attempts made
   */
  @IsNumber()
  @IsNotEmpty()
  attemptCount: number;

  /**
   * Timestamp of the last retry attempt
   */
  @IsString()
  @IsNotEmpty()
  lastAttemptTime: string;

  /**
   * Array of error messages from previous attempts
   */
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];
}

/**
 * DTO for creating a new DLQ item
 */
export class CreateDlqItemDto {
  /**
   * ID of the original notification that failed
   */
  @IsNumber()
  @IsOptional()
  notificationId?: number;

  /**
   * ID of the user who was to receive the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Delivery channel that failed
   */
  @IsString()
  @IsNotEmpty()
  channel: string;

  /**
   * Payload of the notification
   */
  @IsObject()
  @IsNotEmpty()
  payload: any;

  /**
   * Error details that caused the notification to fail
   */
  @IsObject()
  @ValidateNested()
  @Type(() => ErrorDetailsDto)
  @IsNotEmpty()
  errorDetails: ErrorDetailsDto;

  /**
   * History of retry attempts
   */
  @IsObject()
  @ValidateNested()
  @Type(() => RetryHistoryDto)
  @IsNotEmpty()
  retryHistory: RetryHistoryDto;

  /**
   * Additional metadata for the DLQ item
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
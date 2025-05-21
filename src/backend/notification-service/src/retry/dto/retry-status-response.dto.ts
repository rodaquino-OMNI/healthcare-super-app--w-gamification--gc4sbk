import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SendNotificationDto } from '../../notifications/dto/send-notification.dto';

/**
 * Enum representing the possible states of a retry operation
 */
export enum RetryStatus {
  /**
   * Operation is scheduled for retry but not yet attempted
   */
  PENDING = 'PENDING',
  
  /**
   * Operation is currently being retried
   */
  IN_PROGRESS = 'IN_PROGRESS',
  
  /**
   * Operation has been successfully completed after one or more retries
   */
  SUCCEEDED = 'SUCCEEDED',
  
  /**
   * Operation has failed but will be retried
   */
  FAILED = 'FAILED',
  
  /**
   * Operation has failed and exhausted all retry attempts
   */
  EXHAUSTED = 'EXHAUSTED'
}

/**
 * Represents an error entry in the retry history
 */
export class RetryErrorEntry {
  /**
   * Timestamp when the error occurred
   */
  @ApiProperty({ description: 'Timestamp when the error occurred' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Error message
   */
  @ApiProperty({ description: 'Error message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Error code or type
   */
  @ApiProperty({ description: 'Error code or type', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Additional error context
   */
  @ApiProperty({ description: 'Additional error context', required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

/**
 * Data transfer object for retry operation status responses.
 * This DTO defines the structure of retry operations when returned through the API.
 */
export class RetryStatusResponseDto {
  /**
   * Unique identifier for the retry operation
   */
  @ApiProperty({ description: 'Unique identifier for the retry operation' })
  @IsUUID(4)
  @IsNotEmpty()
  id: string;

  /**
   * Notification details associated with this retry operation
   */
  @ApiProperty({ description: 'Notification details associated with this retry operation' })
  @ValidateNested()
  @Type(() => SendNotificationDto)
  notification: SendNotificationDto;

  /**
   * Current status of the retry operation
   */
  @ApiProperty({ 
    description: 'Current status of the retry operation',
    enum: RetryStatus,
    enumName: 'RetryStatus'
  })
  @IsEnum(RetryStatus)
  status: RetryStatus;

  /**
   * Number of retry attempts made so far
   */
  @ApiProperty({ description: 'Number of retry attempts made so far' })
  @IsInt()
  @IsPositive()
  attemptCount: number;

  /**
   * Maximum number of retry attempts allowed
   */
  @ApiProperty({ description: 'Maximum number of retry attempts allowed' })
  @IsInt()
  @IsPositive()
  maxAttempts: number;

  /**
   * Timestamp when the next retry is scheduled (if applicable)
   */
  @ApiProperty({ 
    description: 'Timestamp when the next retry is scheduled (if applicable)',
    required: false
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  nextRetryTime?: Date;

  /**
   * Timestamp when the retry operation was created
   */
  @ApiProperty({ description: 'Timestamp when the retry operation was created' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Timestamp when the retry operation was last updated
   */
  @ApiProperty({ description: 'Timestamp when the retry operation was last updated' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * History of errors encountered during retry attempts
   */
  @ApiProperty({ 
    description: 'History of errors encountered during retry attempts',
    type: [RetryErrorEntry]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetryErrorEntry)
  errorHistory: RetryErrorEntry[];

  /**
   * Type of notification channel (email, sms, push, in-app)
   */
  @ApiProperty({ description: 'Type of notification channel (email, sms, push, in-app)' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  /**
   * Error classification for analytics and reporting
   */
  @ApiProperty({ 
    description: 'Error classification for analytics and reporting',
    required: false
  })
  @IsString()
  @IsOptional()
  errorType?: string;

  /**
   * Additional metadata for the retry operation
   */
  @ApiProperty({ 
    description: 'Additional metadata for the retry operation',
    required: false
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
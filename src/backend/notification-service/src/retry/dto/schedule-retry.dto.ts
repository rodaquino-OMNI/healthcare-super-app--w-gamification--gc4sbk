import { IsUUID, IsString, IsNotEmpty, IsOptional, IsObject, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RetryConfigDto } from './retry-config.dto';

/**
 * Data transfer object for manually scheduling retry operations.
 * This DTO establishes the contract for retry requests, ensuring proper validation
 * of parameters needed to schedule a retry operation in the notification service.
 */
export class ScheduleRetryDto {
  /**
   * The unique identifier of the notification to retry
   */
  @IsUUID(4, { message: 'Notification ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Notification ID is required' })
  notificationId: string;

  /**
   * The type of operation to retry (e.g., 'SEND_EMAIL', 'SEND_PUSH', 'SEND_SMS')
   * This helps the retry service determine which handler to use for the retry
   */
  @IsString()
  @IsNotEmpty({ message: 'Operation type is required' })
  operationType: string;

  /**
   * Additional context about the error that caused the operation to fail
   * This can include error messages, stack traces, or other diagnostic information
   * that might be useful for debugging or determining the appropriate retry strategy
   */
  @IsObject()
  @IsOptional()
  errorContext?: Record<string, any>;

  /**
   * Priority level for the retry operation (1-5, where 1 is highest priority)
   * Higher priority retries may be processed before lower priority ones
   */
  @IsInt()
  @Min(1, { message: 'Priority level must be at least 1' })
  @Max(5, { message: 'Priority level cannot exceed 5' })
  @IsOptional()
  @Type(() => Number)
  priorityLevel?: number;

  /**
   * Custom retry configuration to override the default retry policy
   * This allows for fine-tuning retry behavior for specific notifications
   */
  @ValidateNested()
  @Type(() => RetryConfigDto)
  @IsOptional()
  customRetryConfig?: RetryConfigDto;
}
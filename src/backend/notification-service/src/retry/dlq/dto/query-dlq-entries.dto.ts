import { IsString, IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsISO8601, IsArray, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ErrorType } from '../../constants/error-types.constants';

/**
 * Enum defining the possible statuses of a DLQ entry.
 */
export enum DlqEntryStatus {
  /**
   * The entry is pending resolution or reprocessing.
   */
  PENDING = 'pending',
  
  /**
   * The entry has been manually resolved.
   */
  RESOLVED = 'resolved',
  
  /**
   * The entry has been reprocessed successfully.
   */
  REPROCESSED = 'reprocessed',
  
  /**
   * The entry has been explicitly ignored and will not be processed.
   */
  IGNORED = 'ignored'
}

/**
 * Data Transfer Object for querying Dead Letter Queue (DLQ) entries.
 * 
 * This DTO defines the structure and validation rules for filtering and pagination
 * when querying DLQ entries. It supports filtering by various criteria including
 * user ID, notification ID, error type, channel, status, and time range.
 * 
 * It also includes standard pagination parameters (page and limit) to enable
 * efficient retrieval of large result sets.
 */
export class QueryDlqEntriesDto {
  /**
   * Filter by user ID to find DLQ entries for a specific user.
   * Must be a valid UUID v4.
   */
  @IsUUID(4, { message: 'userId must be a valid UUID v4' })
  @IsOptional()
  userId?: string;

  /**
   * Filter by notification ID to find a specific failed notification.
   * Must be a valid UUID v4.
   */
  @IsUUID(4, { message: 'notificationId must be a valid UUID v4' })
  @IsOptional()
  notificationId?: string;

  /**
   * Filter by error type classification.
   * Must be one of the defined ErrorType enum values.
   */
  @IsEnum(ErrorType, {
    message: 'errorType must be one of: TRANSIENT, CLIENT, SYSTEM, EXTERNAL'
  })
  @IsOptional()
  errorType?: ErrorType;

  /**
   * Filter by multiple error types.
   * Each value must be one of the defined ErrorType enum values.
   */
  @IsArray()
  @IsEnum(ErrorType, {
    each: true,
    message: 'Each errorTypes value must be one of: TRANSIENT, CLIENT, SYSTEM, EXTERNAL'
  })
  @IsOptional()
  errorTypes?: ErrorType[];

  /**
   * Filter by notification channel.
   * Common values include: 'email', 'sms', 'push', 'in-app'.
   */
  @IsString()
  @IsOptional()
  channel?: string;

  /**
   * Filter by multiple notification channels.
   * Common values include: 'email', 'sms', 'push', 'in-app'.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  channels?: string[];

  /**
   * Filter by DLQ entry status.
   * Must be one of the defined DlqEntryStatus enum values.
   */
  @IsEnum(DlqEntryStatus, {
    message: 'status must be one of: pending, resolved, reprocessed, ignored'
  })
  @IsOptional()
  status?: DlqEntryStatus;

  /**
   * Filter by multiple DLQ entry statuses.
   * Each value must be one of the defined DlqEntryStatus enum values.
   */
  @IsArray()
  @IsEnum(DlqEntryStatus, {
    each: true,
    message: 'Each statuses value must be one of: pending, resolved, reprocessed, ignored'
  })
  @IsOptional()
  statuses?: DlqEntryStatus[];

  /**
   * Filter by notification type.
   * Examples: 'achievement', 'appointment-reminder', 'claim-status'.
   */
  @IsString()
  @IsOptional()
  type?: string;

  /**
   * Filter by journey context.
   * Must be one of: 'health', 'care', 'plan'.
   */
  @IsString()
  @IsEnum(['health', 'care', 'plan'], {
    message: 'journey must be one of: health, care, plan'
  })
  @IsOptional()
  journey?: 'health' | 'care' | 'plan';

  /**
   * Filter entries created after this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601({ strict: true }, {
    message: 'createdAfter must be a valid ISO 8601 date string'
  })
  @IsOptional()
  createdAfter?: string;

  /**
   * Filter entries created before this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601({ strict: true }, {
    message: 'createdBefore must be a valid ISO 8601 date string'
  })
  @IsOptional()
  createdBefore?: string;

  /**
   * Filter entries resolved after this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601({ strict: true }, {
    message: 'resolvedAfter must be a valid ISO 8601 date string'
  })
  @IsOptional()
  resolvedAfter?: string;

  /**
   * Filter entries resolved before this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601({ strict: true }, {
    message: 'resolvedBefore must be a valid ISO 8601 date string'
  })
  @IsOptional()
  resolvedBefore?: string;

  /**
   * Filter by minimum number of retry attempts made.
   * Must be a non-negative integer.
   */
  @IsInt()
  @Min(0, { message: 'minAttempts must be a non-negative integer' })
  @IsOptional()
  @Type(() => Number)
  minAttempts?: number;

  /**
   * Filter by maximum number of retry attempts made.
   * Must be a positive integer.
   */
  @IsInt()
  @Min(1, { message: 'maxAttempts must be a positive integer' })
  @IsOptional()
  @Type(() => Number)
  maxAttempts?: number;

  /**
   * Search term to filter by notification title or error message.
   */
  @IsString()
  @IsOptional()
  searchTerm?: string;

  /**
   * Filter by administrator who resolved the entry.
   * Must be a valid UUID v4.
   */
  @IsUUID(4, { message: 'resolvedBy must be a valid UUID v4' })
  @IsOptional()
  resolvedBy?: string;

  /**
   * Page number for pagination.
   * Must be a positive integer.
   * Default: 1
   */
  @IsInt()
  @Min(1, { message: 'page must be a positive integer' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * Maximum number of items per page.
   * Must be between 1 and 100.
   * Default: 20
   */
  @IsInt()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  /**
   * Validate that if resolvedAfter or resolvedBefore is provided,
   * then status must include 'resolved' or 'reprocessed'.
   */
  @ValidateIf(o => o.resolvedAfter !== undefined || o.resolvedBefore !== undefined)
  @IsEnum(['resolved', 'reprocessed'], {
    message: 'When using resolvedAfter or resolvedBefore, status must include resolved or reprocessed'
  })
  validateResolvedTimeFilters?: string;
}
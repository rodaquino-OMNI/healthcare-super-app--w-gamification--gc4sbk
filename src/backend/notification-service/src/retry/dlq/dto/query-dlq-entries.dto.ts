import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ErrorType } from '../../constants/error-types.constants';

/**
 * Enum representing the possible statuses of a DLQ entry.
 */
export enum DlqEntryStatus {
  /**
   * Entry is pending resolution or reprocessing.
   */
  PENDING = 'PENDING',

  /**
   * Entry has been manually resolved by an administrator.
   */
  RESOLVED = 'RESOLVED',

  /**
   * Entry has been reprocessed successfully.
   */
  REPROCESSED = 'REPROCESSED',

  /**
   * Entry has been permanently ignored.
   */
  IGNORED = 'IGNORED'
}

/**
 * Data transfer object for querying Dead Letter Queue (DLQ) entries.
 * This DTO defines the structure and validation rules for filtering and pagination
 * when retrieving DLQ entries through the API.
 */
export class QueryDlqEntriesDto {
  /**
   * Filter by user ID to retrieve all failed notifications for a specific user.
   * Must be a valid UUID v4.
   */
  @IsUUID(4)
  @IsOptional()
  userId?: string;

  /**
   * Filter by notification ID to retrieve a specific failed notification.
   * Must be a valid UUID v4.
   */
  @IsUUID(4)
  @IsOptional()
  notificationId?: string;

  /**
   * Filter by error type classification.
   * Must be one of the defined ErrorType enum values.
   */
  @IsEnum(ErrorType)
  @IsOptional()
  errorType?: ErrorType;

  /**
   * Filter by notification channel (e.g., 'email', 'sms', 'push', 'in-app').
   */
  @IsString()
  @IsOptional()
  channel?: string;

  /**
   * Filter by DLQ entry status.
   * Must be one of the defined DlqEntryStatus enum values.
   */
  @IsEnum(DlqEntryStatus)
  @IsOptional()
  status?: DlqEntryStatus;

  /**
   * Filter for entries created after this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601()
  @IsOptional()
  createdAfter?: string;

  /**
   * Filter for entries created before this timestamp.
   * Must be a valid ISO 8601 date string.
   */
  @IsISO8601()
  @IsOptional()
  createdBefore?: string;

  /**
   * Page number for pagination (1-based).
   * Defaults to 1 if not specified.
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * Maximum number of entries to return per page.
   * Defaults to 20 if not specified.
   * Must be at least 1.
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
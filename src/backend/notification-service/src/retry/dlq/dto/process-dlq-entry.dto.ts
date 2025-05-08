import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';

/**
 * Enum defining the possible actions for processing a DLQ entry.
 */
export enum DlqProcessAction {
  /**
   * Mark the entry as resolved without reprocessing.
   * Used when the issue has been manually fixed or is no longer relevant.
   */
  RESOLVE = 'resolve',
  
  /**
   * Attempt to reprocess the notification.
   * Used when the original issue is believed to be resolved or when providing
   * override parameters to fix the original issue.
   */
  REPROCESS = 'reprocess',
  
  /**
   * Mark the entry as ignored.
   * Used when the notification should not be retried and can be permanently ignored.
   */
  IGNORE = 'ignore'
}

/**
 * Data transfer object for processing DLQ entries.
 * This DTO defines the structure and validation rules for DLQ entry resolution operations
 * throughout the AUSTA SuperApp notification service.
 */
export class ProcessDlqEntryDto {
  /**
   * The action to perform on the DLQ entry.
   * Must be one of: 'resolve', 'reprocess', or 'ignore'.
   */
  @IsEnum(DlqProcessAction, {
    message: 'Action must be one of: resolve, reprocess, or ignore'
  })
  @IsNotEmpty()
  action: DlqProcessAction;

  /**
   * Optional comments to document the manual intervention.
   * Useful for audit trails and understanding why a particular action was taken.
   */
  @IsString()
  @IsOptional()
  comments?: string;

  /**
   * Optional parameters to override in the original notification payload when reprocessing.
   * Only used when action is 'reprocess'.
   * Can include modified notification content, channel preferences, or other properties.
   */
  @IsObject()
  @IsOptional()
  overrideParams?: Record<string, any>;
}
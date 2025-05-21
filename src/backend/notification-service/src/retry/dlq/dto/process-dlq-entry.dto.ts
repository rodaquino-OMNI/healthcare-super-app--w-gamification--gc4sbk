import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';

/**
 * Enum defining the possible actions that can be taken on a DLQ entry
 */
export enum DlqProcessAction {
  /**
   * Mark the entry as resolved without reprocessing
   */
  RESOLVE = 'resolve',
  
  /**
   * Attempt to reprocess the notification with original or modified parameters
   */
  REPROCESS = 'reprocess',
  
  /**
   * Permanently ignore the entry (will not be included in metrics/alerts)
   */
  IGNORE = 'ignore'
}

/**
 * Data transfer object for processing dead letter queue entries.
 * This DTO defines the structure and validation rules for DLQ entry
 * resolution operations throughout the notification service.
 */
export class ProcessDlqEntryDto {
  /**
   * The action to take on the DLQ entry
   */
  @IsEnum(DlqProcessAction)
  @IsNotEmpty()
  action: DlqProcessAction;

  /**
   * Optional comments providing context for the manual intervention
   * Useful for audit trails and understanding resolution patterns
   */
  @IsString()
  @IsOptional()
  comments?: string;

  /**
   * Optional parameters to override the original notification properties
   * Only applicable when action is REPROCESS
   */
  @IsObject()
  @IsOptional()
  overrideParams?: {
    /**
     * Override for the notification title
     */
    title?: string;
    
    /**
     * Override for the notification body
     */
    body?: string;
    
    /**
     * Override for the notification data payload
     */
    data?: any;
    
    /**
     * Override for the notification template ID
     */
    templateId?: string;
    
    /**
     * Override for the notification language
     */
    language?: string;
  };
}
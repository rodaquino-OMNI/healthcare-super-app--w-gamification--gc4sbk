/**
 * Enum representing the possible statuses of a DLQ entry
 */
export enum DlqEntryStatus {
  /**
   * The entry is pending resolution or reprocessing
   */
  PENDING = 'pending',
  
  /**
   * The entry is currently being reprocessed
   */
  REPROCESSING = 'reprocessing',
  
  /**
   * The entry has been resolved (either reprocessed successfully or manually resolved)
   */
  RESOLVED = 'resolved',
  
  /**
   * Reprocessing the entry failed
   */
  FAILED_REPROCESSING = 'failed_reprocessing',
}

/**
 * Interface for DLQ entry filtering options
 */
export interface DlqFilterOptions {
  /**
   * Filter by user ID
   */
  userId?: string;
  
  /**
   * Filter by journey type (health, care, plan)
   */
  journeyType?: string;
  
  /**
   * Filter by error type
   */
  errorType?: string;
  
  /**
   * Filter by status
   */
  status?: DlqEntryStatus;
  
  /**
   * Filter by original topic
   */
  originalTopic?: string;
  
  /**
   * Filter by creation date range (from)
   */
  fromDate?: Date;
  
  /**
   * Filter by creation date range (to)
   */
  toDate?: Date;
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Interface for DLQ statistics
 */
export interface DlqStatistics {
  /**
   * Total number of DLQ entries
   */
  total: number;
  
  /**
   * Number of entries by status
   */
  byStatus: Record<DlqEntryStatus, number>;
  
  /**
   * Number of entries by error type
   */
  byErrorType: Record<string, number>;
  
  /**
   * Number of entries by journey type
   */
  byJourneyType: Record<string, number>;
  
  /**
   * Number of entries by original topic
   */
  byTopic: Record<string, number>;
  
  /**
   * Number of entries created in the last 24 hours
   */
  last24Hours: number;
  
  /**
   * Number of entries created in the last 7 days
   */
  last7Days: number;
}

/**
 * Interface for DLQ reprocessing options
 */
export interface DlqReprocessOptions {
  /**
   * Override headers to add to the reprocessed message
   */
  overrideHeaders?: Record<string, string>;
  
  /**
   * Force reprocessing even if the entry is already resolved or being reprocessed
   */
  forceReprocess?: boolean;
}
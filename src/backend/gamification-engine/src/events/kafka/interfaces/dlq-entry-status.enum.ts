/**
 * Enum representing the possible statuses of a DLQ entry
 */
export enum DlqEntryStatus {
  /**
   * Entry has been added to the DLQ but not yet processed
   */
  PENDING = 'PENDING',

  /**
   * Entry is currently being reprocessed
   */
  REPROCESSING = 'REPROCESSING',

  /**
   * Entry has been successfully reprocessed
   */
  REPROCESSED = 'REPROCESSED',

  /**
   * Reprocessing of the entry failed
   */
  REPROCESS_FAILED = 'REPROCESS_FAILED',

  /**
   * Entry has been manually resolved without reprocessing
   */
  RESOLVED = 'RESOLVED',

  /**
   * Entry has been marked as ignored (will not be processed)
   */
  IGNORED = 'IGNORED',
}
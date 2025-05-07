/**
 * Enum representing the possible actions that can be taken on a DLQ entry
 */
export enum DlqProcessAction {
  /**
   * Attempt to reprocess the failed event
   */
  REPROCESS = 'REPROCESS',

  /**
   * Mark the entry as resolved without reprocessing
   */
  RESOLVE = 'RESOLVE',

  /**
   * Mark the entry as ignored (will not be processed)
   */
  IGNORE = 'IGNORE',
}
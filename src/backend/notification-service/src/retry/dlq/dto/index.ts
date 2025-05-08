/**
 * @file Barrel file that exports all Data Transfer Objects (DTOs) from the DLQ module.
 * 
 * This file provides a clean, unified import interface for all DTOs related to the
 * Dead Letter Queue functionality. It simplifies imports throughout the application
 * by allowing consumers to import multiple DTOs from a single path, enforcing a
 * consistent pattern for module exports, and establishing a clear public API boundary.
 *
 * @module retry/dlq/dto
 */

/**
 * Re-export QueryDlqEntriesDto which establishes the contract for filtering and pagination
 * when querying Dead Letter Queue (DLQ) entries. It includes parameters for filtering by
 * userId, notificationId, errorType, channel, status, and time range.
 */
export * from './query-dlq-entries.dto';

/**
 * Re-export DlqEntryResponseDto which represents the structure of Dead Letter Queue (DLQ)
 * entries when returned through the API. It includes all essential information about failed
 * notifications, error details, and retry history.
 */
export * from './dlq-entry-response.dto';

/**
 * Re-export ProcessDlqEntryDto which establishes the contract for DLQ entry resolution
 * operations. It defines the action to take on a DLQ entry (resolve, reprocess, ignore)
 * and optional parameters for these operations.
 */
export * from './process-dlq-entry.dto';

/**
 * Re-export DlqStatisticsResponseDto which structures the statistical data about
 * Dead Letter Queue entries. It includes counters for total entries, entries by error type,
 * entries by channel, entries by status, and time-based metrics.
 */
export * from './dlq-statistics-response.dto';
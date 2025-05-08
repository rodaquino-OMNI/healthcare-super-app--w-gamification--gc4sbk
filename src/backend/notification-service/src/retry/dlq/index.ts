/**
 * @file Barrel file that exports all components from the DLQ (Dead Letter Queue) module.
 * 
 * This file provides a clean, unified interface for external consumers of the DLQ module.
 * It simplifies imports and ensures that only the intended public API of the DLQ module
 * is exposed. This pattern enables consistent usage patterns and encapsulation of
 * implementation details across the notification service.
 *
 * @module retry/dlq
 */

/**
 * Re-export the DLQ entity that defines the database schema for storing dead-letter queue entries.
 * This entity maps properties like id, notificationId, userId, channel, payload, errorDetails,
 * retryHistory, createdAt, and updatedAt to database columns.
 */
export * from './dlq-entry.entity';

/**
 * Re-export the DLQ controller that exposes REST API endpoints for managing the dead-letter queue.
 * This controller provides endpoints for retrieving DLQ entries with filtering and pagination,
 * inspecting individual entries, manually resolving or reprocessing entries, and retrieving DLQ statistics.
 */
export * from './dlq.controller';

/**
 * Re-export the DLQ service that manages the dead-letter queue for failed notifications.
 * This service provides methods for adding entries to the queue, retrieving entries based on
 * various filters, and supporting manual resolution or reprocessing of failed notifications.
 */
export * from './dlq.service';

/**
 * Re-export all DTOs (Data Transfer Objects) from the DLQ module.
 * These DTOs define the structure for API requests and responses related to DLQ operations,
 * including querying entries, processing entries, and retrieving statistics.
 */
export * from './dto';
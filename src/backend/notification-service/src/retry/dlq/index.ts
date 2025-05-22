/**
 * Dead Letter Queue (DLQ) module barrel file
 * 
 * This file exports all components from the DLQ module to provide a clean,
 * unified interface for external consumers. It simplifies imports and ensures
 * that only the intended public API of the DLQ module is exposed.
 *
 * @module retry/dlq
 */

// Export the entity
export { DlqEntry } from './dlq-entry.entity';

// Export the service
export { DlqService } from './dlq.service';

// Export the controller
export { DlqController } from './dlq.controller';

// Re-export all DTOs from the DTO barrel file
export * from './dto';
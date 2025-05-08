/**
 * @file index.ts
 * @description Barrel file that exports all quest-related exception classes.
 * This centralized export pattern simplifies imports, reduces code duplication,
 * and ensures all exceptions are properly exposed throughout the application.
 *
 * @module quests/exceptions
 * @category Error Handling
 */

// Base Exception Classes and Interfaces
// =====================================

/**
 * Base exception class and error context interface for quest exceptions.
 * These provide the foundation for all quest-specific error handling.
 */
export { 
  BaseQuestException, 
  QuestErrorContext 
} from '@app/gamification-engine/quests/exceptions/base-quest.exception';

// Error Types and Metadata
// =======================

/**
 * Quest-specific error types, codes, and metadata interfaces.
 * These provide a structured approach to error classification and handling.
 */
export {
  QUEST_ERROR_CODES,
  QUEST_ERROR_MESSAGES,
  QUEST_HTTP_STATUS_CODES,
  QUEST_ERROR_CATEGORIES,
  QUEST_ERROR_SEVERITIES,
  QUEST_RETRY_CONFIG,
  createQuestErrorMetadata,
  
  // Error metadata interfaces
  QuestNotFoundErrorMetadata,
  QuestAlreadyStartedErrorMetadata,
  QuestAlreadyCompletedErrorMetadata,
  QuestNotStartedErrorMetadata,
  QuestProcessingErrorMetadata,
  QuestErrorMetadata
} from '@app/gamification-engine/quests/exceptions/quest-exception.types';

// Client Errors (4xx)
// ==================

/**
 * Exception thrown when a requested quest cannot be found.
 * This is a client error (404) that occurs when attempting to retrieve,
 * update, or delete a quest that doesn't exist in the system.
 */
export { QuestNotFoundException } from '@app/gamification-engine/quests/exceptions/quest-not-found.exception';

/**
 * Exception thrown when a user attempts to start a quest they have already started.
 * This is a client error (409 Conflict) that occurs when attempting to start
 * a quest that is already in progress for the user.
 */
export { QuestAlreadyStartedException } from '@app/gamification-engine/quests/exceptions/quest-already-started.exception';

/**
 * Exception thrown when a user attempts to complete a quest they have already completed.
 * This is a client error (409 Conflict) that occurs when attempting to complete
 * a quest that has already been marked as completed for the user.
 */
export { QuestAlreadyCompletedException } from '@app/gamification-engine/quests/exceptions/quest-already-completed.exception';

/**
 * Exception thrown when a user attempts to complete a quest they haven't started.
 * This is a client error (422 Unprocessable Entity) that occurs when attempting to
 * complete a quest that the user has not yet started.
 */
export { QuestNotStartedException } from '@app/gamification-engine/quests/exceptions/quest-not-started.exception';

// System Errors (5xx)
// ==================

/**
 * Exception thrown when quest processing fails due to internal errors.
 * This is a system error (500) that occurs during quest operations like
 * starting, updating progress, or completing quests.
 */
export { QuestProcessingException } from '@app/gamification-engine/quests/exceptions/quest-processing.exception';

// Default Exports
// ==============

/**
 * Default exports for all quest exceptions to support both import styles:
 * - Named imports: import { QuestNotFoundException } from './exceptions';
 * - Default imports: import QuestNotFoundException from './exceptions/quest-not-found.exception';
 */
export default {
  BaseQuestException,
  QuestNotFoundException,
  QuestAlreadyStartedException,
  QuestAlreadyCompletedException,
  QuestNotStartedException,
  QuestProcessingException
};
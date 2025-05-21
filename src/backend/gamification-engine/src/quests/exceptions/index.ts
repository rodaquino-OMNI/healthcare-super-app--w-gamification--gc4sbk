/**
 * @file Quest Exceptions Index
 * @description Barrel file that exports all quest-related exception classes from a single entry point,
 * simplifying imports throughout the application.
 */

// Import all quest exception classes
import { BaseQuestException } from '@app/quests/exceptions/base-quest.exception';
import { QuestNotFoundException } from '@app/quests/exceptions/quest-not-found.exception';
import { QuestAlreadyStartedException } from '@app/quests/exceptions/quest-already-started.exception';
import { QuestAlreadyCompletedException } from '@app/quests/exceptions/quest-already-completed.exception';
import { QuestNotStartedException } from '@app/quests/exceptions/quest-not-started.exception';
import { QuestProcessingException } from '@app/quests/exceptions/quest-processing.exception';

// Export all exceptions as named exports
export {
  BaseQuestException,
  QuestNotFoundException,
  QuestAlreadyStartedException,
  QuestAlreadyCompletedException,
  QuestNotStartedException,
  QuestProcessingException
};

// Export interfaces for type usage
export type { 
  IBaseQuestException,
  IQuestExceptionContext
} from '@app/quests/exceptions/base-quest.exception';

// Create a default export with all exceptions
const QuestExceptions = {
  BaseQuestException,
  QuestNotFoundException,
  QuestAlreadyStartedException,
  QuestAlreadyCompletedException,
  QuestNotStartedException,
  QuestProcessingException
};

// Default export for more flexible import options
export default QuestExceptions;
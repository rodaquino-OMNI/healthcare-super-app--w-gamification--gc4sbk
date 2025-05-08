/**
 * @file Quest Interfaces Barrel File
 * 
 * This barrel file re-exports all quest interface definitions to simplify imports.
 * It consolidates QuestInterface, UserQuestInterface, QuestEventInterface, and 
 * QuestFilterInterface exports, providing a single import point for consumers and 
 * ensuring consistent usage patterns across the codebase.
 * 
 * @example
 * // Import all quest interfaces
 * import { QuestInterface, UserQuestInterface, QuestEventInterface, QuestFilterInterface } from './quests/interfaces';
 * 
 * // Or import specific interfaces
 * import { QuestInterface } from './quests/interfaces';
 */

// Re-export quest interfaces
export { QuestInterface } from './quest.interface';
export { UserQuestInterface } from './user-quest.interface';

// Re-export QuestStatus enum from @austa/interfaces
export { QuestStatus } from '@austa/interfaces/gamification';

// Re-export quest event interfaces
export { 
  IQuestEvent,
  IQuestEventData,
  IQuestStartedEventData,
  IQuestProgressedEventData,
  IQuestCompletedEventData,
  IQuestExpiredEventData,
  IQuestResetEventData,
  QuestEventType,
  QuestStartedEvent,
  QuestProgressedEvent,
  QuestCompletedEvent,
  QuestExpiredEvent,
  QuestResetEvent,
  QuestEvent,
  isQuestStartedEvent,
  isQuestProgressedEvent,
  isQuestCompletedEvent,
  isQuestExpiredEvent,
  isQuestResetEvent,
  createQuestStartedEvent,
  createQuestCompletedEvent
} from './quest-event.interface';

// Re-export quest filter interfaces
export { QuestFilterInterface } from './quest-filter.interface';

// Note: Additional types and enums can be added here as needed
/**
 * @file index.ts
 * @description Barrel file that exports all log formatter implementations and interfaces
 * for use throughout the logging package. This file enables clean imports and consistent
 * use of formatters across the codebase.
 */

// Export formatter interfaces
export { Formatter, LogEntry } from './formatter.interface';

// Export formatter implementations
export { JSONFormatter } from './json.formatter';
export { TextFormatter } from './text.formatter';
export { CloudWatchFormatter } from './cloudwatch.formatter';

// Re-export related types from interfaces directory
export { LogLevel, LogLevelUtils, LogLevelString } from '../interfaces/log-level.enum';
export { 
  JourneyType, 
  JourneyContext, 
  ErrorInfo 
} from '../interfaces/log-entry.interface';
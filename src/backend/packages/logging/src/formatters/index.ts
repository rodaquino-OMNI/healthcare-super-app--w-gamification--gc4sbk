/**
 * @file Formatters Module
 * @description Exports all log formatter implementations and interfaces for use throughout the logging package.
 * This barrel file enables clean imports and consistent use of formatters across the codebase.
 */

// Export formatter interfaces
export {
  Formatter,
  LogLevel,
  JourneyType,
  LogErrorInfo,
  TraceContext,
  JourneyContext,
  LogEntry,
} from './formatter.interface';

// Export formatter implementations
export { JsonFormatter } from './json.formatter';
export { TextFormatter } from './text.formatter';
export { CloudWatchFormatter } from './cloudwatch.formatter';

// Re-export interfaces from log-entry.interface for backward compatibility
export {
  LogEntry as LogEntryData,
  LogLevel as LogLevelType,
  JourneyType as JourneyTypeEnum,
  JourneyContext as JourneyContextData,
  ErrorObject,
} from '../interfaces/log-entry.interface';
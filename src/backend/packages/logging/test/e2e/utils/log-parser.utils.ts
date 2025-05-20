/**
 * @file log-parser.utils.ts
 * @description Provides utilities for parsing and analyzing log output in structured formats.
 * Includes functions to parse JSON logs, extract fields, validate format compliance, and analyze log structure.
 * Essential for verifying that logs conform to the expected structure and contain required fields for proper monitoring and observability.
 */

import { LogLevel, LogLevelString, LogLevelUtils } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/transport.interface';

/**
 * Error thrown when log parsing or validation fails
 */
export class LogParsingError extends Error {
  constructor(message: string, public readonly logData?: any) {
    super(message);
    this.name = 'LogParsingError';
  }
}

/**
 * Result of log validation
 */
export interface LogValidationResult {
  /**
   * Whether the log is valid
   */
  valid: boolean;

  /**
   * Validation errors, if any
   */
  errors: string[];

  /**
   * Warnings about non-critical issues, if any
   */
  warnings: string[];

  /**
   * The parsed log entry, if parsing was successful
   */
  parsedLog?: LogEntry;
}

/**
 * Options for log validation
 */
export interface LogValidationOptions {
  /**
   * Whether to require a trace ID
   * @default true
   */
  requireTraceId?: boolean;

  /**
   * Whether to require a service name
   * @default true
   */
  requireService?: boolean;

  /**
   * Whether to require a journey identifier
   * @default false
   */
  requireJourney?: boolean;

  /**
   * List of required context fields
   * @default ['requestId']
   */
  requiredContextFields?: string[];

  /**
   * Whether to validate timestamp format
   * @default true
   */
  validateTimestamp?: boolean;

  /**
   * Whether to validate log level values
   * @default true
   */
  validateLogLevel?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_VALIDATION_OPTIONS: LogValidationOptions = {
  requireTraceId: true,
  requireService: true,
  requireJourney: false,
  requiredContextFields: ['requestId'],
  validateTimestamp: true,
  validateLogLevel: true,
};

/**
 * Parses a JSON log string into a structured object
 * @param logString JSON log string to parse
 * @returns Parsed log object
 * @throws LogParsingError if parsing fails
 */
export function parseJsonLog(logString: string): Record<string, any> {
  try {
    return JSON.parse(logString);
  } catch (error) {
    throw new LogParsingError(`Failed to parse log as JSON: ${error.message}`, logString);
  }
}

/**
 * Parses a log string into a structured LogEntry object
 * @param logString Log string to parse (JSON format expected)
 * @returns Parsed LogEntry object
 * @throws LogParsingError if parsing fails or required fields are missing
 */
export function parseLogEntry(logString: string): LogEntry {
  const parsedLog = parseJsonLog(logString);
  
  // Validate required fields
  if (!parsedLog.level) {
    throw new LogParsingError('Log entry is missing required field: level', parsedLog);
  }
  
  if (!parsedLog.timestamp) {
    throw new LogParsingError('Log entry is missing required field: timestamp', parsedLog);
  }
  
  if (!parsedLog.message && parsedLog.message !== '') {
    throw new LogParsingError('Log entry is missing required field: message', parsedLog);
  }
  
  // Convert string level to enum if needed
  let level: LogLevel;
  if (typeof parsedLog.level === 'string') {
    const levelValue = LogLevelUtils.fromString(parsedLog.level);
    if (levelValue === undefined) {
      throw new LogParsingError(`Invalid log level: ${parsedLog.level}`, parsedLog);
    }
    level = levelValue;
  } else if (typeof parsedLog.level === 'number') {
    level = parsedLog.level;
  } else {
    throw new LogParsingError(`Invalid log level type: ${typeof parsedLog.level}`, parsedLog);
  }
  
  // Convert timestamp string to Date if needed
  let timestamp: Date;
  if (typeof parsedLog.timestamp === 'string') {
    timestamp = new Date(parsedLog.timestamp);
    if (isNaN(timestamp.getTime())) {
      throw new LogParsingError(`Invalid timestamp format: ${parsedLog.timestamp}`, parsedLog);
    }
  } else if (parsedLog.timestamp instanceof Date) {
    timestamp = parsedLog.timestamp;
  } else {
    throw new LogParsingError(`Invalid timestamp type: ${typeof parsedLog.timestamp}`, parsedLog);
  }
  
  // Construct the LogEntry object
  const logEntry: LogEntry = {
    level,
    timestamp,
    message: parsedLog.message,
  };
  
  // Add optional fields if present
  if (parsedLog.error) {
    logEntry.error = parsedLog.error;
  }
  
  if (parsedLog.context) {
    logEntry.context = parsedLog.context;
  }
  
  if (parsedLog.traceId) {
    logEntry.traceId = parsedLog.traceId;
  }
  
  if (parsedLog.service) {
    logEntry.service = parsedLog.service;
  }
  
  if (parsedLog.journey) {
    logEntry.journey = parsedLog.journey;
  }
  
  if (parsedLog.meta) {
    logEntry.meta = parsedLog.meta;
  }
  
  return logEntry;
}

/**
 * Validates a log string against the expected format and requirements
 * @param logString Log string to validate (JSON format expected)
 * @param options Validation options
 * @returns Validation result with details about validity and any issues found
 */
export function validateLog(logString: string, options: LogValidationOptions = {}): LogValidationResult {
  const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const result: LogValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  try {
    const parsedLog = parseLogEntry(logString);
    result.parsedLog = parsedLog;
    
    // Validate log level if required
    if (mergedOptions.validateLogLevel) {
      const validLevels = LogLevelUtils.getAllLevelValues();
      if (!validLevels.includes(parsedLog.level)) {
        result.errors.push(`Invalid log level: ${parsedLog.level}`);
        result.valid = false;
      }
    }
    
    // Validate timestamp if required
    if (mergedOptions.validateTimestamp) {
      if (!(parsedLog.timestamp instanceof Date) || isNaN(parsedLog.timestamp.getTime())) {
        result.errors.push(`Invalid timestamp: ${parsedLog.timestamp}`);
        result.valid = false;
      }
    }
    
    // Check for required trace ID
    if (mergedOptions.requireTraceId && !parsedLog.traceId) {
      result.errors.push('Missing required field: traceId');
      result.valid = false;
    }
    
    // Check for required service name
    if (mergedOptions.requireService && !parsedLog.service) {
      result.errors.push('Missing required field: service');
      result.valid = false;
    }
    
    // Check for required journey identifier
    if (mergedOptions.requireJourney && !parsedLog.journey) {
      result.errors.push('Missing required field: journey');
      result.valid = false;
    }
    
    // Check for required context fields
    if (mergedOptions.requiredContextFields && mergedOptions.requiredContextFields.length > 0) {
      if (!parsedLog.context) {
        result.errors.push('Missing required field: context');
        result.valid = false;
      } else {
        for (const field of mergedOptions.requiredContextFields) {
          if (parsedLog.context[field] === undefined) {
            result.errors.push(`Missing required context field: ${field}`);
            result.valid = false;
          }
        }
      }
    }
    
    // Add warnings for potentially problematic issues
    if (!parsedLog.error && parsedLog.level >= LogLevel.ERROR) {
      result.warnings.push(`Error-level log without error object: ${parsedLog.message}`);
    }
    
    if (parsedLog.message.length === 0) {
      result.warnings.push('Log has empty message');
    }
    
  } catch (error) {
    if (error instanceof LogParsingError) {
      result.errors.push(error.message);
    } else {
      result.errors.push(`Unexpected error during validation: ${error.message}`);
    }
    result.valid = false;
  }
  
  return result;
}

/**
 * Extracts a specific field from a log entry
 * @param logEntry Log entry or log string to extract from
 * @param fieldPath Path to the field (dot notation for nested fields, e.g., 'context.userId')
 * @returns The extracted field value or undefined if not found
 */
export function extractLogField(logEntry: LogEntry | string, fieldPath: string): any {
  const entry = typeof logEntry === 'string' ? parseLogEntry(logEntry) : logEntry;
  
  const pathParts = fieldPath.split('.');
  let value: any = entry;
  
  for (const part of pathParts) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[part];
  }
  
  return value;
}

/**
 * Checks if a log entry contains a specific field with an optional expected value
 * @param logEntry Log entry or log string to check
 * @param fieldPath Path to the field (dot notation for nested fields)
 * @param expectedValue Optional expected value to compare against
 * @returns True if the field exists and matches the expected value (if provided)
 */
export function logContainsField(logEntry: LogEntry | string, fieldPath: string, expectedValue?: any): boolean {
  const value = extractLogField(logEntry, fieldPath);
  
  if (value === undefined) {
    return false;
  }
  
  if (expectedValue !== undefined) {
    if (typeof expectedValue === 'object') {
      return JSON.stringify(value) === JSON.stringify(expectedValue);
    }
    return value === expectedValue;
  }
  
  return true;
}

/**
 * Filters an array of log entries by log level
 * @param logs Array of log entries or log strings
 * @param level Minimum log level to include
 * @returns Filtered array of log entries
 */
export function filterLogsByLevel(logs: (LogEntry | string)[], level: LogLevel | LogLevelString): LogEntry[] {
  const minLevel = typeof level === 'string' ? LogLevelUtils.fromString(level) : level;
  
  if (minLevel === undefined) {
    throw new Error(`Invalid log level: ${level}`);
  }
  
  return logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log)
    .filter(entry => entry.level >= minLevel);
}

/**
 * Filters an array of log entries by journey
 * @param logs Array of log entries or log strings
 * @param journey Journey identifier to filter by
 * @returns Filtered array of log entries
 */
export function filterLogsByJourney(logs: (LogEntry | string)[], journey: string): LogEntry[] {
  return logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log)
    .filter(entry => entry.journey === journey);
}

/**
 * Filters an array of log entries by service
 * @param logs Array of log entries or log strings
 * @param service Service name to filter by
 * @returns Filtered array of log entries
 */
export function filterLogsByService(logs: (LogEntry | string)[], service: string): LogEntry[] {
  return logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log)
    .filter(entry => entry.service === service);
}

/**
 * Filters an array of log entries by trace ID
 * @param logs Array of log entries or log strings
 * @param traceId Trace ID to filter by
 * @returns Filtered array of log entries
 */
export function filterLogsByTraceId(logs: (LogEntry | string)[], traceId: string): LogEntry[] {
  return logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log)
    .filter(entry => entry.traceId === traceId);
}

/**
 * Filters an array of log entries by context field value
 * @param logs Array of log entries or log strings
 * @param fieldName Context field name to filter by
 * @param fieldValue Expected field value
 * @returns Filtered array of log entries
 */
export function filterLogsByContextField(logs: (LogEntry | string)[], fieldName: string, fieldValue: any): LogEntry[] {
  return logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log)
    .filter(entry => entry.context && entry.context[fieldName] === fieldValue);
}

/**
 * Counts the number of log entries by level
 * @param logs Array of log entries or log strings
 * @returns Object with counts for each log level
 */
export function countLogsByLevel(logs: (LogEntry | string)[]): Record<LogLevelString, number> {
  const counts: Record<LogLevelString, number> = {
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0,
  };
  
  logs.forEach(log => {
    const entry = typeof log === 'string' ? parseLogEntry(log) : log;
    const levelString = LogLevelUtils.toString(entry.level);
    counts[levelString]++;
  });
  
  return counts;
}

/**
 * Analyzes a collection of logs for common patterns and issues
 * @param logs Array of log entries or log strings
 * @returns Analysis results with statistics and potential issues
 */
export function analyzeLogStructure(logs: (LogEntry | string)[]): {
  totalLogs: number;
  levelCounts: Record<LogLevelString, number>;
  journeyCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  missingTraceIds: number;
  missingContextFields: string[];
  inconsistentFields: string[];
  potentialIssues: string[];
} {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log);
  const levelCounts = countLogsByLevel(parsedLogs);
  
  // Count journeys
  const journeyCounts: Record<string, number> = {};
  parsedLogs.forEach(log => {
    if (log.journey) {
      journeyCounts[log.journey] = (journeyCounts[log.journey] || 0) + 1;
    }
  });
  
  // Count services
  const serviceCounts: Record<string, number> = {};
  parsedLogs.forEach(log => {
    if (log.service) {
      serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1;
    }
  });
  
  // Count missing trace IDs
  const missingTraceIds = parsedLogs.filter(log => !log.traceId).length;
  
  // Find missing context fields
  const allContextFields = new Set<string>();
  parsedLogs.forEach(log => {
    if (log.context) {
      Object.keys(log.context).forEach(key => allContextFields.add(key));
    }
  });
  
  const missingContextFields: string[] = [];
  allContextFields.forEach(field => {
    const missingCount = parsedLogs.filter(log => !log.context || log.context[field] === undefined).length;
    if (missingCount > 0 && missingCount < parsedLogs.length) {
      missingContextFields.push(`${field} (missing in ${missingCount}/${parsedLogs.length} logs)`);
    }
  });
  
  // Check for inconsistent fields
  const inconsistentFields: string[] = [];
  
  // Check for service name consistency
  const services = new Set(parsedLogs.map(log => log.service).filter(Boolean));
  if (services.size > 1) {
    inconsistentFields.push(`service (${services.size} different values)`);
  }
  
  // Identify potential issues
  const potentialIssues: string[] = [];
  
  // Check for errors without error objects
  const errorsWithoutErrorObject = parsedLogs.filter(
    log => (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) && !log.error
  ).length;
  
  if (errorsWithoutErrorObject > 0) {
    potentialIssues.push(`${errorsWithoutErrorObject} error logs without error objects`);
  }
  
  // Check for empty messages
  const emptyMessages = parsedLogs.filter(log => log.message.trim().length === 0).length;
  if (emptyMessages > 0) {
    potentialIssues.push(`${emptyMessages} logs with empty messages`);
  }
  
  // Check for missing context
  const missingContext = parsedLogs.filter(log => !log.context || Object.keys(log.context).length === 0).length;
  if (missingContext > 0) {
    potentialIssues.push(`${missingContext} logs without context information`);
  }
  
  return {
    totalLogs: parsedLogs.length,
    levelCounts,
    journeyCounts,
    serviceCounts,
    missingTraceIds,
    missingContextFields,
    inconsistentFields,
    potentialIssues,
  };
}

/**
 * Checks if a collection of logs contains a specific log pattern
 * @param logs Array of log entries or log strings
 * @param pattern Object with fields to match against log entries
 * @returns True if at least one log matches the pattern
 */
export function logsContainPattern(logs: (LogEntry | string)[], pattern: Partial<LogEntry>): boolean {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log);
  
  return parsedLogs.some(log => {
    for (const [key, value] of Object.entries(pattern)) {
      if (key === 'level' && typeof value === 'string') {
        const levelValue = LogLevelUtils.fromString(value);
        if (levelValue === undefined || log.level !== levelValue) {
          return false;
        }
      } else if (key === 'timestamp' && typeof value === 'string') {
        const timestampValue = new Date(value);
        if (isNaN(timestampValue.getTime()) || log.timestamp.getTime() !== timestampValue.getTime()) {
          return false;
        }
      } else if (key === 'context' && typeof value === 'object') {
        if (!log.context) return false;
        for (const [contextKey, contextValue] of Object.entries(value)) {
          if (log.context[contextKey] !== contextValue) {
            return false;
          }
        }
      } else if (log[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Extracts all logs matching a specific pattern
 * @param logs Array of log entries or log strings
 * @param pattern Object with fields to match against log entries
 * @returns Array of matching log entries
 */
export function extractLogsByPattern(logs: (LogEntry | string)[], pattern: Partial<LogEntry>): LogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log);
  
  return parsedLogs.filter(log => {
    for (const [key, value] of Object.entries(pattern)) {
      if (key === 'level' && typeof value === 'string') {
        const levelValue = LogLevelUtils.fromString(value);
        if (levelValue === undefined || log.level !== levelValue) {
          return false;
        }
      } else if (key === 'timestamp' && typeof value === 'string') {
        const timestampValue = new Date(value);
        if (isNaN(timestampValue.getTime()) || log.timestamp.getTime() !== timestampValue.getTime()) {
          return false;
        }
      } else if (key === 'context' && typeof value === 'object') {
        if (!log.context) return false;
        for (const [contextKey, contextValue] of Object.entries(value)) {
          if (log.context[contextKey] !== contextValue) {
            return false;
          }
        }
      } else if (log[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Validates that a collection of logs contains all required journey-specific context
 * @param logs Array of log entries or log strings
 * @param journey Journey identifier to validate
 * @returns Validation result with details about validity and any issues found
 */
export function validateJourneyLogs(logs: (LogEntry | string)[], journey: string): LogValidationResult {
  const result: LogValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseLogEntry(log) : log);
  const journeyLogs = parsedLogs.filter(log => log.journey === journey);
  
  if (journeyLogs.length === 0) {
    result.errors.push(`No logs found for journey: ${journey}`);
    result.valid = false;
    return result;
  }
  
  // Define required context fields for each journey
  const requiredFields: Record<string, string[]> = {
    health: ['userId', 'requestId', 'healthMetricId'],
    care: ['userId', 'requestId', 'appointmentId'],
    plan: ['userId', 'requestId', 'planId'],
  };
  
  if (!requiredFields[journey]) {
    result.warnings.push(`Unknown journey: ${journey}, cannot validate required fields`);
    return result;
  }
  
  // Check for required fields in all logs
  for (const log of journeyLogs) {
    if (!log.context) {
      result.errors.push(`Log missing context object for journey: ${journey}`);
      result.valid = false;
      continue;
    }
    
    for (const field of requiredFields[journey]) {
      if (log.context[field] === undefined) {
        result.errors.push(`Log missing required context field for ${journey} journey: ${field}`);
        result.valid = false;
      }
    }
  }
  
  return result;
}
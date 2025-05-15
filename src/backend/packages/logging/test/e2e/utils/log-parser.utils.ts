import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';

/**
 * Interface representing a parsed log entry with additional validation metadata
 */
export interface ParsedLog {
  /** The original raw log string */
  raw: string;
  /** The parsed log object */
  parsed: Record<string, any>;
  /** Whether the log is valid JSON */
  isValidJson: boolean;
  /** Whether the log contains all required fields */
  hasRequiredFields: boolean;
  /** Any validation errors found */
  validationErrors: string[];
  /** The log level if present */
  level?: LogLevel;
  /** The timestamp if present */
  timestamp?: string;
  /** The message if present */
  message?: string;
  /** The service name if present */
  service?: string;
  /** The journey context if present */
  journey?: string;
  /** The request ID if present */
  requestId?: string;
  /** The user ID if present */
  userId?: string;
  /** The trace ID if present */
  traceId?: string;
}

/**
 * Interface for log validation options
 */
export interface LogValidationOptions {
  /** Whether to require a timestamp */
  requireTimestamp?: boolean;
  /** Whether to require a message */
  requireMessage?: boolean;
  /** Whether to require a log level */
  requireLevel?: boolean;
  /** Whether to require a service name */
  requireService?: boolean;
  /** Whether to require journey context */
  requireJourney?: boolean;
  /** Whether to require a request ID */
  requireRequestId?: boolean;
  /** Whether to require a user ID */
  requireUserId?: boolean;
  /** Whether to require a trace ID */
  requireTraceId?: boolean;
  /** Additional required fields */
  additionalRequiredFields?: string[];
}

/**
 * Default validation options requiring common fields
 */
const DEFAULT_VALIDATION_OPTIONS: LogValidationOptions = {
  requireTimestamp: true,
  requireMessage: true,
  requireLevel: true,
  requireService: true,
  requireJourney: false,
  requireRequestId: false,
  requireUserId: false,
  requireTraceId: false,
  additionalRequiredFields: [],
};

/**
 * Parses a log string into a structured object
 * @param logString The raw log string to parse
 * @returns A ParsedLog object with the parsed log and validation information
 */
export function parseLog(logString: string): ParsedLog {
  const result: ParsedLog = {
    raw: logString,
    parsed: {},
    isValidJson: false,
    hasRequiredFields: false,
    validationErrors: [],
  };

  try {
    result.parsed = JSON.parse(logString);
    result.isValidJson = true;

    // Extract common fields
    result.level = result.parsed.level;
    result.timestamp = result.parsed.timestamp;
    result.message = result.parsed.message;
    result.service = result.parsed.service;
    
    // Extract context fields
    const context = result.parsed.context || {};
    result.journey = context.journey;
    result.requestId = context.requestId || context.request_id;
    result.userId = context.userId || context.user_id;
    result.traceId = context.traceId || context.trace_id;

    // Validate required fields with default options
    result.hasRequiredFields = validateRequiredFields(result, DEFAULT_VALIDATION_OPTIONS).length === 0;
  } catch (error) {
    result.isValidJson = false;
    result.validationErrors.push(`Invalid JSON: ${error.message}`);
  }

  return result;
}

/**
 * Parses multiple log lines into an array of ParsedLog objects
 * @param logLines Array of log strings or a multi-line log string
 * @returns Array of ParsedLog objects
 */
export function parseLogLines(logLines: string | string[]): ParsedLog[] {
  const lines = Array.isArray(logLines) ? logLines : logLines.split('\n').filter(line => line.trim());
  return lines.map(line => parseLog(line));
}

/**
 * Validates that a parsed log contains all required fields
 * @param parsedLog The parsed log to validate
 * @param options Validation options specifying required fields
 * @returns Array of validation error messages (empty if valid)
 */
export function validateRequiredFields(
  parsedLog: ParsedLog,
  options: LogValidationOptions = DEFAULT_VALIDATION_OPTIONS
): string[] {
  const errors: string[] = [];

  if (!parsedLog.isValidJson) {
    errors.push('Log is not valid JSON');
    return errors;
  }

  // Check required standard fields
  if (options.requireTimestamp && !parsedLog.timestamp) {
    errors.push('Missing required field: timestamp');
  }

  if (options.requireMessage && !parsedLog.message) {
    errors.push('Missing required field: message');
  }

  if (options.requireLevel && !parsedLog.level) {
    errors.push('Missing required field: level');
  }

  if (options.requireService && !parsedLog.service) {
    errors.push('Missing required field: service');
  }

  // Check required context fields
  if (options.requireJourney && !parsedLog.journey) {
    errors.push('Missing required context field: journey');
  }

  if (options.requireRequestId && !parsedLog.requestId) {
    errors.push('Missing required context field: requestId');
  }

  if (options.requireUserId && !parsedLog.userId) {
    errors.push('Missing required context field: userId');
  }

  if (options.requireTraceId && !parsedLog.traceId) {
    errors.push('Missing required context field: traceId');
  }

  // Check additional required fields
  if (options.additionalRequiredFields) {
    for (const field of options.additionalRequiredFields) {
      if (!hasNestedField(parsedLog.parsed, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return errors;
}

/**
 * Checks if a log entry has the correct format for its level
 * @param parsedLog The parsed log to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateLogLevelFormat(parsedLog: ParsedLog): string[] {
  const errors: string[] = [];

  if (!parsedLog.isValidJson) {
    errors.push('Log is not valid JSON');
    return errors;
  }

  if (!parsedLog.level) {
    errors.push('Log does not have a level field');
    return errors;
  }

  // Define level-specific required fields
  const levelOptions: Record<LogLevel, LogValidationOptions> = {
    [LogLevel.DEBUG]: {
      requireTimestamp: true,
      requireMessage: true,
      requireLevel: true,
      requireService: true,
    },
    [LogLevel.INFO]: {
      requireTimestamp: true,
      requireMessage: true,
      requireLevel: true,
      requireService: true,
    },
    [LogLevel.WARN]: {
      requireTimestamp: true,
      requireMessage: true,
      requireLevel: true,
      requireService: true,
    },
    [LogLevel.ERROR]: {
      requireTimestamp: true,
      requireMessage: true,
      requireLevel: true,
      requireService: true,
      additionalRequiredFields: ['error'],
    },
    [LogLevel.FATAL]: {
      requireTimestamp: true,
      requireMessage: true,
      requireLevel: true,
      requireService: true,
      additionalRequiredFields: ['error'],
    },
  };

  // Validate based on the log level
  return validateRequiredFields(parsedLog, levelOptions[parsedLog.level]);
}

/**
 * Extracts a specific field from a parsed log
 * @param parsedLog The parsed log to extract from
 * @param fieldPath Dot notation path to the field (e.g., 'context.requestId')
 * @returns The field value or undefined if not found
 */
export function extractField(parsedLog: ParsedLog, fieldPath: string): any {
  if (!parsedLog.isValidJson) {
    return undefined;
  }

  return getNestedField(parsedLog.parsed, fieldPath);
}

/**
 * Filters logs by a specific field value
 * @param logs Array of parsed logs
 * @param fieldPath Dot notation path to the field
 * @param value Value to match
 * @returns Filtered array of logs matching the criteria
 */
export function filterLogsByField(logs: ParsedLog[], fieldPath: string, value: any): ParsedLog[] {
  return logs.filter(log => {
    const fieldValue = extractField(log, fieldPath);
    return fieldValue === value;
  });
}

/**
 * Filters logs by log level
 * @param logs Array of parsed logs
 * @param level Log level to filter by
 * @returns Filtered array of logs with the specified level
 */
export function filterLogsByLevel(logs: ParsedLog[], level: LogLevel): ParsedLog[] {
  return logs.filter(log => log.level === level);
}

/**
 * Filters logs by journey
 * @param logs Array of parsed logs
 * @param journey Journey name to filter by
 * @returns Filtered array of logs for the specified journey
 */
export function filterLogsByJourney(logs: ParsedLog[], journey: string): ParsedLog[] {
  return logs.filter(log => log.journey === journey);
}

/**
 * Filters logs by request ID
 * @param logs Array of parsed logs
 * @param requestId Request ID to filter by
 * @returns Filtered array of logs with the specified request ID
 */
export function filterLogsByRequestId(logs: ParsedLog[], requestId: string): ParsedLog[] {
  return logs.filter(log => log.requestId === requestId);
}

/**
 * Filters logs by user ID
 * @param logs Array of parsed logs
 * @param userId User ID to filter by
 * @returns Filtered array of logs with the specified user ID
 */
export function filterLogsByUserId(logs: ParsedLog[], userId: string): ParsedLog[] {
  return logs.filter(log => log.userId === userId);
}

/**
 * Filters logs by trace ID
 * @param logs Array of parsed logs
 * @param traceId Trace ID to filter by
 * @returns Filtered array of logs with the specified trace ID
 */
export function filterLogsByTraceId(logs: ParsedLog[], traceId: string): ParsedLog[] {
  return logs.filter(log => log.traceId === traceId);
}

/**
 * Analyzes a collection of logs for format compliance
 * @param logs Array of parsed logs to analyze
 * @returns Analysis results with statistics and validation information
 */
export function analyzeLogStructure(logs: ParsedLog[]): {
  totalLogs: number;
  validJsonCount: number;
  validFormatCount: number;
  invalidLogs: ParsedLog[];
  levelCounts: Record<string, number>;
  journeyCounts: Record<string, number>;
  missingFieldCounts: Record<string, number>;
} {
  const result = {
    totalLogs: logs.length,
    validJsonCount: 0,
    validFormatCount: 0,
    invalidLogs: [] as ParsedLog[],
    levelCounts: {} as Record<string, number>,
    journeyCounts: {} as Record<string, number>,
    missingFieldCounts: {} as Record<string, number>,
  };

  for (const log of logs) {
    // Count valid JSON logs
    if (log.isValidJson) {
      result.validJsonCount++;
    }

    // Count logs with valid format
    if (log.hasRequiredFields) {
      result.validFormatCount++;
    } else {
      result.invalidLogs.push(log);
    }

    // Count by log level
    if (log.level) {
      result.levelCounts[log.level] = (result.levelCounts[log.level] || 0) + 1;
    }

    // Count by journey
    if (log.journey) {
      result.journeyCounts[log.journey] = (result.journeyCounts[log.journey] || 0) + 1;
    }

    // Count missing fields
    for (const error of log.validationErrors) {
      const match = error.match(/Missing required (?:context )?field: (.+)/);
      if (match) {
        const field = match[1];
        result.missingFieldCounts[field] = (result.missingFieldCounts[field] || 0) + 1;
      }
    }
  }

  return result;
}

/**
 * Validates that logs contain proper correlation between request ID and trace ID
 * @param logs Array of parsed logs to validate
 * @returns Array of validation error messages
 */
export function validateLogCorrelation(logs: ParsedLog[]): string[] {
  const errors: string[] = [];
  const requestGroups: Record<string, Set<string>> = {};

  // Group logs by request ID and collect trace IDs
  for (const log of logs) {
    if (log.requestId && log.traceId) {
      if (!requestGroups[log.requestId]) {
        requestGroups[log.requestId] = new Set<string>();
      }
      requestGroups[log.requestId].add(log.traceId);
    }
  }

  // Check that each request ID has exactly one trace ID
  for (const [requestId, traceIds] of Object.entries(requestGroups)) {
    if (traceIds.size > 1) {
      errors.push(`Request ID ${requestId} has multiple trace IDs: ${Array.from(traceIds).join(', ')}`);
    }
  }

  return errors;
}

/**
 * Validates that logs for a journey contain all required journey-specific fields
 * @param logs Array of parsed logs to validate
 * @param journey Journey name to validate
 * @param requiredFields Array of required field paths for the journey
 * @returns Array of validation error messages
 */
export function validateJourneyLogs(logs: ParsedLog[], journey: string, requiredFields: string[]): string[] {
  const errors: string[] = [];
  const journeyLogs = filterLogsByJourney(logs, journey);

  if (journeyLogs.length === 0) {
    errors.push(`No logs found for journey: ${journey}`);
    return errors;
  }

  for (const log of journeyLogs) {
    for (const field of requiredFields) {
      if (!hasNestedField(log.parsed, field)) {
        errors.push(`Log missing required journey field: ${field} for journey: ${journey}`);
      }
    }
  }

  return errors;
}

/**
 * Checks if a log entry has a valid timestamp format
 * @param parsedLog The parsed log to validate
 * @returns True if the timestamp is valid, false otherwise
 */
export function hasValidTimestamp(parsedLog: ParsedLog): boolean {
  if (!parsedLog.timestamp) {
    return false;
  }

  // Check if timestamp is ISO format or Unix timestamp
  const isIsoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(parsedLog.timestamp);
  const isUnixTimestamp = /^\d{13}$/.test(parsedLog.timestamp);

  return isIsoFormat || isUnixTimestamp;
}

/**
 * Gets a nested field from an object using dot notation
 * @param obj The object to extract from
 * @param path Dot notation path to the field
 * @returns The field value or undefined if not found
 */
function getNestedField(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Checks if a nested field exists in an object
 * @param obj The object to check
 * @param path Dot notation path to the field
 * @returns True if the field exists, false otherwise
 */
function hasNestedField(obj: Record<string, any>, path: string): boolean {
  return getNestedField(obj, path) !== undefined;
}

/**
 * Validates that error logs contain proper error information
 * @param logs Array of parsed logs to validate
 * @returns Array of validation error messages
 */
export function validateErrorLogs(logs: ParsedLog[]): string[] {
  const errors: string[] = [];
  const errorLogs = logs.filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL);

  for (const log of errorLogs) {
    const errorObj = extractField(log, 'error');
    
    if (!errorObj) {
      errors.push(`Error log missing error object: ${log.raw}`);
      continue;
    }

    if (!errorObj.message) {
      errors.push(`Error object missing message: ${JSON.stringify(errorObj)}`);
    }

    // For FATAL logs, stack trace should be present
    if (log.level === LogLevel.FATAL && !errorObj.stack) {
      errors.push(`FATAL error missing stack trace: ${JSON.stringify(errorObj)}`);
    }
  }

  return errors;
}

/**
 * Validates that logs have consistent service names
 * @param logs Array of parsed logs to validate
 * @param expectedService Expected service name
 * @returns Array of logs with incorrect service names
 */
export function validateServiceName(logs: ParsedLog[], expectedService: string): ParsedLog[] {
  return logs.filter(log => log.service !== expectedService);
}

/**
 * Extracts all unique values for a specific field across logs
 * @param logs Array of parsed logs
 * @param fieldPath Dot notation path to the field
 * @returns Array of unique values for the field
 */
export function extractUniqueFieldValues(logs: ParsedLog[], fieldPath: string): any[] {
  const values = new Set<any>();
  
  for (const log of logs) {
    const value = extractField(log, fieldPath);
    if (value !== undefined) {
      values.add(value);
    }
  }

  return Array.from(values);
}
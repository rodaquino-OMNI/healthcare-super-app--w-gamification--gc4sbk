import { LogLevel, LogLevelUtils } from '../../../src/interfaces/log-level.enum';
import { JourneyType } from '../../../src/interfaces/log-entry.interface';

/**
 * Interface representing a parsed log entry from JSON format.
 * This mirrors the structure produced by JSONFormatter.
 */
export interface ParsedLogEntry {
  message: string;
  level: string;
  levelCode: number;
  timestamp: string;
  service: string;
  context: string;
  request?: {
    id: string;
    clientIp?: string;
    userAgent?: string;
  };
  user?: {
    id?: string;
    sessionId?: string;
  };
  trace?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
  journey?: {
    type: JourneyType;
    resourceId?: string;
    action?: string;
    data?: Record<string, any>;
  };
  error?: {
    message: string;
    name: string;
    code?: string | number;
    stack?: string;
    isTransient?: boolean;
    isClientError?: boolean;
    isExternalError?: boolean;
    originalError?: Record<string, any>;
  };
  contextData?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interface for log validation options.
 */
export interface LogValidationOptions {
  /** Whether to require a request ID */
  requireRequestId?: boolean;
  /** Whether to require a user ID */
  requireUserId?: boolean;
  /** Whether to require trace information */
  requireTrace?: boolean;
  /** Whether to require journey context */
  requireJourney?: boolean;
  /** Whether to require a specific journey type */
  journeyType?: JourneyType;
  /** Whether to require a specific log level or higher */
  minimumLevel?: LogLevel;
  /** Whether to require a specific service name */
  serviceName?: string;
  /** Whether to require a specific context */
  context?: string;
  /** Custom validation function */
  customValidator?: (log: ParsedLogEntry) => boolean;
}

/**
 * Result of a log validation operation.
 */
export interface LogValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** List of validation errors if any */
  errors: string[];
  /** The parsed log entry that was validated */
  parsedLog: ParsedLogEntry;
}

/**
 * Parses a JSON log string into a structured object.
 * @param logString The JSON log string to parse
 * @returns The parsed log entry
 * @throws Error if the log string is not valid JSON
 */
export function parseJsonLog(logString: string): ParsedLogEntry {
  try {
    return JSON.parse(logString) as ParsedLogEntry;
  } catch (error) {
    throw new Error(`Failed to parse log as JSON: ${error.message}`);
  }
}

/**
 * Parses multiple JSON log strings into structured objects.
 * @param logStrings Array of JSON log strings to parse
 * @returns Array of parsed log entries
 * @throws Error if any log string is not valid JSON
 */
export function parseJsonLogs(logStrings: string[]): ParsedLogEntry[] {
  return logStrings.map(logString => parseJsonLog(logString));
}

/**
 * Validates that a log entry contains all required fields and meets specified criteria.
 * @param log The log entry to validate
 * @param options Validation options
 * @returns Validation result with details
 */
export function validateLogEntry(log: ParsedLogEntry | string, options: LogValidationOptions = {}): LogValidationResult {
  const parsedLog = typeof log === 'string' ? parseJsonLog(log) : log;
  const errors: string[] = [];

  // Check basic required fields
  if (!parsedLog.message) {
    errors.push('Log entry is missing required field: message');
  }

  if (!parsedLog.level) {
    errors.push('Log entry is missing required field: level');
  } else {
    try {
      // Verify the level is valid
      LogLevelUtils.fromString(parsedLog.level);
    } catch (error) {
      errors.push(`Invalid log level: ${parsedLog.level}`);
    }
  }

  if (!parsedLog.timestamp) {
    errors.push('Log entry is missing required field: timestamp');
  } else {
    // Verify the timestamp is a valid ISO date string
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(parsedLog.timestamp)) {
      errors.push(`Invalid timestamp format: ${parsedLog.timestamp}`);
    }
  }

  if (!parsedLog.service) {
    errors.push('Log entry is missing required field: service');
  } else if (options.serviceName && parsedLog.service !== options.serviceName) {
    errors.push(`Expected service name ${options.serviceName}, but got ${parsedLog.service}`);
  }

  if (!parsedLog.context) {
    errors.push('Log entry is missing required field: context');
  } else if (options.context && parsedLog.context !== options.context) {
    errors.push(`Expected context ${options.context}, but got ${parsedLog.context}`);
  }

  // Check minimum log level if specified
  if (options.minimumLevel !== undefined && parsedLog.levelCode !== undefined) {
    if (parsedLog.levelCode < options.minimumLevel) {
      errors.push(`Log level ${parsedLog.level} is below minimum required level ${LogLevelUtils.toString(options.minimumLevel)}`);
    }
  }

  // Check request ID if required
  if (options.requireRequestId && (!parsedLog.request || !parsedLog.request.id)) {
    errors.push('Log entry is missing required request ID');
  }

  // Check user ID if required
  if (options.requireUserId && (!parsedLog.user || !parsedLog.user.id)) {
    errors.push('Log entry is missing required user ID');
  }

  // Check trace information if required
  if (options.requireTrace && (!parsedLog.trace || !parsedLog.trace.traceId)) {
    errors.push('Log entry is missing required trace information');
  }

  // Check journey context if required
  if (options.requireJourney && (!parsedLog.journey || !parsedLog.journey.type)) {
    errors.push('Log entry is missing required journey context');
  } else if (parsedLog.journey && options.journeyType && parsedLog.journey.type !== options.journeyType) {
    errors.push(`Expected journey type ${options.journeyType}, but got ${parsedLog.journey.type}`);
  }

  // Run custom validator if provided
  if (options.customValidator) {
    try {
      if (!options.customValidator(parsedLog)) {
        errors.push('Log entry failed custom validation');
      }
    } catch (error) {
      errors.push(`Custom validation threw an error: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    parsedLog
  };
}

/**
 * Validates multiple log entries against the specified criteria.
 * @param logs Array of log entries to validate
 * @param options Validation options
 * @returns Array of validation results
 */
export function validateLogEntries(logs: (ParsedLogEntry | string)[], options: LogValidationOptions = {}): LogValidationResult[] {
  return logs.map(log => validateLogEntry(log, options));
}

/**
 * Extracts a specific field from a log entry using a dot-notation path.
 * @param log The log entry to extract from
 * @param path The dot-notation path to the field (e.g., 'journey.type')
 * @returns The extracted field value or undefined if not found
 */
export function extractLogField(log: ParsedLogEntry | string, path: string): any {
  const parsedLog = typeof log === 'string' ? parseJsonLog(log) : log;
  
  const parts = path.split('.');
  let value: any = parsedLog;
  
  for (const part of parts) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[part];
  }
  
  return value;
}

/**
 * Extracts a specific field from multiple log entries.
 * @param logs Array of log entries to extract from
 * @param path The dot-notation path to the field
 * @returns Array of extracted field values
 */
export function extractLogFields(logs: (ParsedLogEntry | string)[], path: string): any[] {
  return logs.map(log => extractLogField(log, path));
}

/**
 * Filters log entries based on a field value.
 * @param logs Array of log entries to filter
 * @param path The dot-notation path to the field
 * @param value The value to compare against
 * @returns Filtered array of log entries
 */
export function filterLogsByField(logs: (ParsedLogEntry | string)[], path: string, value: any): ParsedLogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  
  return parsedLogs.filter(log => {
    const fieldValue = extractLogField(log, path);
    return fieldValue === value;
  });
}

/**
 * Filters log entries based on a predicate function.
 * @param logs Array of log entries to filter
 * @param predicate Function that returns true for logs to include
 * @returns Filtered array of log entries
 */
export function filterLogs(logs: (ParsedLogEntry | string)[], predicate: (log: ParsedLogEntry) => boolean): ParsedLogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  return parsedLogs.filter(predicate);
}

/**
 * Filters log entries by log level.
 * @param logs Array of log entries to filter
 * @param level Minimum log level to include
 * @returns Filtered array of log entries
 */
export function filterLogsByLevel(logs: (ParsedLogEntry | string)[], level: LogLevel): ParsedLogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  
  return parsedLogs.filter(log => {
    try {
      const logLevel = typeof log.level === 'string' 
        ? LogLevelUtils.fromString(log.level) 
        : log.levelCode;
      
      return logLevel >= level;
    } catch (error) {
      return false;
    }
  });
}

/**
 * Filters log entries by journey type.
 * @param logs Array of log entries to filter
 * @param journeyType Journey type to filter by
 * @returns Filtered array of log entries
 */
export function filterLogsByJourney(logs: (ParsedLogEntry | string)[], journeyType: JourneyType): ParsedLogEntry[] {
  return filterLogsByField(logs, 'journey.type', journeyType);
}

/**
 * Filters log entries by error presence.
 * @param logs Array of log entries to filter
 * @param hasError Whether to include logs with errors (true) or without errors (false)
 * @returns Filtered array of log entries
 */
export function filterLogsByError(logs: (ParsedLogEntry | string)[], hasError: boolean): ParsedLogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  
  return parsedLogs.filter(log => {
    const hasErrorField = log.error !== undefined && log.error !== null;
    return hasError ? hasErrorField : !hasErrorField;
  });
}

/**
 * Counts log entries by a specific field value.
 * @param logs Array of log entries to analyze
 * @param path The dot-notation path to the field
 * @returns Object mapping field values to counts
 */
export function countLogsByField(logs: (ParsedLogEntry | string)[], path: string): Record<string, number> {
  const fieldValues = extractLogFields(logs, path);
  
  const counts: Record<string, number> = {};
  
  for (const value of fieldValues) {
    const key = value !== undefined && value !== null ? String(value) : 'undefined';
    counts[key] = (counts[key] || 0) + 1;
  }
  
  return counts;
}

/**
 * Counts log entries by log level.
 * @param logs Array of log entries to analyze
 * @returns Object mapping log levels to counts
 */
export function countLogsByLevel(logs: (ParsedLogEntry | string)[]): Record<string, number> {
  return countLogsByField(logs, 'level');
}

/**
 * Counts log entries by journey type.
 * @param logs Array of log entries to analyze
 * @returns Object mapping journey types to counts
 */
export function countLogsByJourney(logs: (ParsedLogEntry | string)[]): Record<string, number> {
  return countLogsByField(logs, 'journey.type');
}

/**
 * Analyzes log entries for common patterns and issues.
 * @param logs Array of log entries to analyze
 * @returns Analysis results with insights and potential issues
 */
export function analyzeLogStructure(logs: (ParsedLogEntry | string)[]): {
  totalLogs: number;
  levelCounts: Record<string, number>;
  journeyCounts: Record<string, number>;
  errorCount: number;
  missingFields: Record<string, number>;
  inconsistentFields: string[];
  potentialIssues: string[];
} {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  
  const levelCounts = countLogsByLevel(parsedLogs);
  const journeyCounts = countLogsByJourney(parsedLogs);
  const errorLogs = filterLogsByError(parsedLogs, true);
  
  // Check for missing fields
  const requiredFields = ['message', 'level', 'timestamp', 'service', 'context'];
  const missingFields: Record<string, number> = {};
  
  for (const field of requiredFields) {
    const missingCount = parsedLogs.filter(log => !extractLogField(log, field)).length;
    if (missingCount > 0) {
      missingFields[field] = missingCount;
    }
  }
  
  // Check for inconsistent fields
  const inconsistentFields: string[] = [];
  const fieldPresenceMap: Record<string, boolean[]> = {
    'request': parsedLogs.map(log => log.request !== undefined),
    'user': parsedLogs.map(log => log.user !== undefined),
    'trace': parsedLogs.map(log => log.trace !== undefined),
    'journey': parsedLogs.map(log => log.journey !== undefined),
    'contextData': parsedLogs.map(log => log.contextData !== undefined),
    'metadata': parsedLogs.map(log => log.metadata !== undefined)
  };
  
  for (const [field, presence] of Object.entries(fieldPresenceMap)) {
    const presentCount = presence.filter(Boolean).length;
    if (presentCount > 0 && presentCount < parsedLogs.length) {
      inconsistentFields.push(field);
    }
  }
  
  // Identify potential issues
  const potentialIssues: string[] = [];
  
  // Check for high error rate
  if (errorLogs.length > parsedLogs.length * 0.2) {
    potentialIssues.push(`High error rate: ${errorLogs.length} errors in ${parsedLogs.length} logs (${Math.round(errorLogs.length / parsedLogs.length * 100)}%)`);
  }
  
  // Check for missing journey context in non-system logs
  const nonSystemLogs = parsedLogs.filter(log => log.context !== 'system' && log.context !== 'global');
  const missingJourneyLogs = nonSystemLogs.filter(log => !log.journey);
  if (missingJourneyLogs.length > nonSystemLogs.length * 0.1) {
    potentialIssues.push(`Missing journey context in ${missingJourneyLogs.length} non-system logs (${Math.round(missingJourneyLogs.length / nonSystemLogs.length * 100)}%)`);
  }
  
  // Check for missing trace IDs in request logs
  const requestLogs = parsedLogs.filter(log => log.request);
  const missingTraceLogs = requestLogs.filter(log => !log.trace || !log.trace.traceId);
  if (missingTraceLogs.length > requestLogs.length * 0.1) {
    potentialIssues.push(`Missing trace IDs in ${missingTraceLogs.length} request logs (${Math.round(missingTraceLogs.length / requestLogs.length * 100)}%)`);
  }
  
  return {
    totalLogs: parsedLogs.length,
    levelCounts,
    journeyCounts,
    errorCount: errorLogs.length,
    missingFields,
    inconsistentFields,
    potentialIssues
  };
}

/**
 * Compares two log entries for equality based on specified fields.
 * @param logA First log entry
 * @param logB Second log entry
 * @param fields Array of field paths to compare
 * @returns Whether the specified fields are equal in both logs
 */
export function compareLogEntries(logA: ParsedLogEntry | string, logB: ParsedLogEntry | string, fields: string[]): boolean {
  const parsedLogA = typeof logA === 'string' ? parseJsonLog(logA) : logA;
  const parsedLogB = typeof logB === 'string' ? parseJsonLog(logB) : logB;
  
  for (const field of fields) {
    const valueA = extractLogField(parsedLogA, field);
    const valueB = extractLogField(parsedLogB, field);
    
    // Handle special case for objects and arrays
    if (typeof valueA === 'object' && valueA !== null && typeof valueB === 'object' && valueB !== null) {
      if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        return false;
      }
    } else if (valueA !== valueB) {
      return false;
    }
  }
  
  return true;
}

/**
 * Finds log entries that match a specific pattern.
 * @param logs Array of log entries to search
 * @param pattern Object with field paths and values to match
 * @returns Array of matching log entries
 */
export function findLogsByPattern(logs: (ParsedLogEntry | string)[], pattern: Record<string, any>): ParsedLogEntry[] {
  const parsedLogs = logs.map(log => typeof log === 'string' ? parseJsonLog(log) : log);
  
  return parsedLogs.filter(log => {
    for (const [path, value] of Object.entries(pattern)) {
      const fieldValue = extractLogField(log, path);
      
      // Handle special case for objects and arrays
      if (typeof value === 'object' && value !== null && typeof fieldValue === 'object' && fieldValue !== null) {
        if (JSON.stringify(fieldValue) !== JSON.stringify(value)) {
          return false;
        }
      } else if (fieldValue !== value) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Extracts all unique values for a specific field across log entries.
 * @param logs Array of log entries to analyze
 * @param path The dot-notation path to the field
 * @returns Array of unique field values
 */
export function extractUniqueValues(logs: (ParsedLogEntry | string)[], path: string): any[] {
  const values = extractLogFields(logs, path);
  return [...new Set(values.filter(value => value !== undefined && value !== null))];
}

/**
 * Checks if a log entry matches a specific pattern.
 * @param log Log entry to check
 * @param pattern Object with field paths and values to match
 * @returns Whether the log entry matches the pattern
 */
export function matchesPattern(log: ParsedLogEntry | string, pattern: Record<string, any>): boolean {
  const parsedLog = typeof log === 'string' ? parseJsonLog(log) : log;
  
  for (const [path, value] of Object.entries(pattern)) {
    const fieldValue = extractLogField(parsedLog, path);
    
    // Handle special case for objects and arrays
    if (typeof value === 'object' && value !== null && typeof fieldValue === 'object' && fieldValue !== null) {
      if (JSON.stringify(fieldValue) !== JSON.stringify(value)) {
        return false;
      }
    } else if (fieldValue !== value) {
      return false;
    }
  }
  
  return true;
}
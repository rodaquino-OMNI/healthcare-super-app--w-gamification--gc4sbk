import { LogEntry } from '../interfaces/log-entry.interface';

/**
 * Interface that all log formatters must implement.
 * Establishes a contract for transforming log entries into formatted output.
 */
export interface Formatter {
  /**
   * Formats a log entry into a string representation.
   * @param entry The log entry to format
   * @returns The formatted log entry as a string
   */
  format(entry: LogEntry): string;
}
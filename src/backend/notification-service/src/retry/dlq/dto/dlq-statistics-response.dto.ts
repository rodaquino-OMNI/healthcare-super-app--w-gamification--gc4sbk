import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for Dead Letter Queue (DLQ) statistics.
 * 
 * This DTO structures statistical data about DLQ entries for monitoring and analysis purposes.
 * It provides comprehensive metrics about failed notifications, including:
 * - Total number of entries in the DLQ
 * - Distribution by error type (client, system, transient, external)
 * - Distribution by notification channel (email, sms, push, in-app)
 * - Distribution by journey context (health, care, plan, game)
 * - Distribution by status (pending, resolved, reprocessed, ignored)
 * - Time-based metrics for trend analysis
 * - Performance metrics like average time in queue
 * 
 * These statistics are critical for monitoring the health of the notification system,
 * identifying patterns in delivery failures, and driving improvements to notification reliability.
 */
export class DlqStatisticsResponseDto {
  /**
   * Total number of entries in the Dead Letter Queue
   * @example 157
   */
  @ApiProperty({
    description: 'Total number of entries in the Dead Letter Queue',
    example: 157,
    type: Number
  })
  totalEntries: number;

  /**
   * Distribution of DLQ entries by error type
   */
  @ApiProperty({
    description: 'Distribution of DLQ entries by error type',
    example: {
      client: 42,
      system: 35,
      transient: 28,
      external: 47,
      unknown: 5
    },
    type: 'object'
  })
  byErrorType: {
    /**
     * Number of entries with client errors (4xx)
     * These are errors caused by invalid input or client configuration
     * @example 42
     */
    client: number;

    /**
     * Number of entries with system errors (5xx)
     * These are errors caused by internal system failures
     * @example 35
     */
    system: number;

    /**
     * Number of entries with transient errors
     * These are temporary issues that might be resolved by retrying
     * @example 28
     */
    transient: number;

    /**
     * Number of entries with external dependency errors
     * These are errors caused by failures in external services
     * @example 47
     */
    external: number;

    /**
     * Number of entries with unknown error types
     * @example 5
     */
    unknown: number;
  };

  /**
   * Distribution of DLQ entries by notification channel
   */
  @ApiProperty({
    description: 'Distribution of DLQ entries by notification channel',
    example: {
      email: 65,
      sms: 32,
      push: 48,
      'in-app': 12
    },
    type: 'object'
  })
  byChannel: {
    /**
     * Number of failed email notifications
     * @example 65
     */
    email: number;

    /**
     * Number of failed SMS notifications
     * @example 32
     */
    sms: number;

    /**
     * Number of failed push notifications
     * @example 48
     */
    push: number;

    /**
     * Number of failed in-app notifications
     * @example 12
     */
    'in-app': number;
  };

  /**
   * Distribution of DLQ entries by journey context
   */
  @ApiProperty({
    description: 'Distribution of DLQ entries by journey context',
    example: {
      health: 45,
      care: 38,
      plan: 27,
      game: 32,
      unknown: 15
    },
    type: 'object'
  })
  byJourney: {
    /**
     * Number of entries from the Health journey
     * @example 45
     */
    health: number;

    /**
     * Number of entries from the Care journey
     * @example 38
     */
    care: number;

    /**
     * Number of entries from the Plan journey
     * @example 27
     */
    plan: number;

    /**
     * Number of entries from the Gamification system
     * @example 32
     */
    game: number;

    /**
     * Number of entries with unknown journey context
     * @example 15
     */
    unknown: number;
  };

  /**
   * Distribution of DLQ entries by status
   */
  @ApiProperty({
    description: 'Distribution of DLQ entries by status',
    example: {
      pending: 87,
      resolved: 35,
      reprocessed: 28,
      ignored: 7
    },
    type: 'object'
  })
  byStatus: {
    /**
     * Number of pending entries awaiting resolution
     * @example 87
     */
    pending: number;

    /**
     * Number of entries that have been manually resolved
     * @example 35
     */
    resolved: number;

    /**
     * Number of entries that have been reprocessed
     * @example 28
     */
    reprocessed: number;

    /**
     * Number of entries that have been ignored
     * @example 7
     */
    ignored: number;
  };

  /**
   * Time-based distribution of DLQ entries for trend analysis
   * The period format depends on the requested timeframe:
   * - day: hourly periods (e.g., "0h", "1h", ...)
   * - week: daily periods (e.g., "Mon", "Tue", ...)
   * - month: daily periods (e.g., "1", "2", ...)
   * - all: monthly periods (e.g., "Jan", "Feb", ...)
   */
  @ApiProperty({
    description: 'Time-based distribution of DLQ entries for trend analysis',
    example: [
      { period: 'Jan', count: 12 },
      { period: 'Feb', count: 15 },
      { period: 'Mar', count: 8 },
      { period: 'Apr', count: 17 },
      { period: 'May', count: 10 }
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Time period label' },
        count: { type: 'number', description: 'Number of entries in this period' }
      }
    }
  })
  byTimePeriod: Array<{
    /**
     * Label for the time period
     * @example "Jan"
     */
    period: string;

    /**
     * Number of entries in this time period
     * @example 12
     */
    count: number;
  }>;

  /**
   * Average time entries spend in the DLQ before resolution (in milliseconds)
   * This metric helps track how quickly issues are being addressed
   * @example 86400000
   */
  @ApiProperty({
    description: 'Average time entries spend in the DLQ before resolution (in milliseconds)',
    example: 86400000, // 24 hours in milliseconds
    type: Number
  })
  averageTimeInQueue: number;
}
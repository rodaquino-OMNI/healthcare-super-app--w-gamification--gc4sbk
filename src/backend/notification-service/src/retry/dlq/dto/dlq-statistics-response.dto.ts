import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for DLQ (Dead Letter Queue) statistics.
 * This DTO provides comprehensive metrics about the state of the DLQ,
 * including counts by error type, notification channel, status, and time periods.
 * It is used by monitoring dashboards and alerting systems to track DLQ health.
 */
export class DlqStatisticsResponseDto {
  /**
   * Total number of entries currently in the DLQ
   */
  @ApiProperty({
    description: 'Total number of entries currently in the DLQ',
    example: 42,
  })
  totalEntries: number;

  /**
   * Breakdown of entries by error type
   */
  @ApiProperty({
    description: 'Breakdown of entries by error type',
    example: {
      client: 12,
      system: 8,
      transient: 15,
      external: 7,
    },
  })
  entriesByErrorType: {
    client: number;
    system: number;
    transient: number;
    external: number;
  };

  /**
   * Breakdown of entries by notification channel
   */
  @ApiProperty({
    description: 'Breakdown of entries by notification channel',
    example: {
      email: 18,
      sms: 10,
      push: 9,
      'in-app': 5,
    },
  })
  entriesByChannel: {
    email: number;
    sms: number;
    push: number;
    'in-app': number;
  };

  /**
   * Breakdown of entries by current status
   */
  @ApiProperty({
    description: 'Breakdown of entries by current status',
    example: {
      pending: 30,
      resolved: 8,
      reprocessed: 4,
    },
  })
  entriesByStatus: {
    pending: number;
    resolved: number;
    reprocessed: number;
  };

  /**
   * Breakdown of entries by time period
   */
  @ApiProperty({
    description: 'Breakdown of entries by time period',
    example: {
      lastHour: 5,
      last24Hours: 18,
      last7Days: 35,
      last30Days: 42,
    },
  })
  entriesByTimePeriod: {
    lastHour: number;
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };

  /**
   * Average time entries spend in the DLQ before resolution (in milliseconds)
   */
  @ApiProperty({
    description: 'Average time entries spend in the DLQ before resolution (in milliseconds)',
    example: 86400000, // 24 hours in milliseconds
  })
  averageTimeInQueue: number;

  /**
   * Breakdown of entries by journey type
   */
  @ApiProperty({
    description: 'Breakdown of entries by journey type',
    example: {
      health: 15,
      care: 12,
      plan: 10,
      gamification: 5,
    },
  })
  entriesByJourney: {
    health: number;
    care: number;
    plan: number;
    gamification: number;
  };

  /**
   * Top error reasons with counts
   */
  @ApiProperty({
    description: 'Top error reasons with counts',
    example: [
      { reason: 'EMAIL_PROVIDER_UNAVAILABLE', count: 8 },
      { reason: 'INVALID_PHONE_NUMBER', count: 6 },
      { reason: 'PUSH_TOKEN_EXPIRED', count: 5 },
    ],
  })
  topErrorReasons: Array<{ reason: string; count: number }>;

  /**
   * Resolution rate statistics
   */
  @ApiProperty({
    description: 'Resolution rate statistics',
    example: {
      automaticResolutionRate: 0.15, // 15%
      manualResolutionRate: 0.25, // 25%
      totalResolutionRate: 0.40, // 40%
    },
  })
  resolutionRates: {
    automaticResolutionRate: number;
    manualResolutionRate: number;
    totalResolutionRate: number;
  };

  /**
   * Trend data showing DLQ entry counts over time
   */
  @ApiProperty({
    description: 'Trend data showing DLQ entry counts over time',
    example: [
      { timestamp: '2023-04-01T00:00:00Z', count: 12 },
      { timestamp: '2023-04-02T00:00:00Z', count: 15 },
      { timestamp: '2023-04-03T00:00:00Z', count: 10 },
      { timestamp: '2023-04-04T00:00:00Z', count: 8 },
      { timestamp: '2023-04-05T00:00:00Z', count: 5 },
    ],
  })
  entryTrends: Array<{ timestamp: string; count: number }>;
}
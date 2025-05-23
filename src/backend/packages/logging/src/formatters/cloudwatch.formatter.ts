import { LogEntry, JourneyType } from '../interfaces/log-entry.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { JsonFormatter } from './json.formatter';

/**
 * CloudWatch formatter that extends the JSON formatter with CloudWatch-specific optimizations.
 * This formatter ensures logs are properly formatted for CloudWatch Logs Insights queries
 * and adds AWS-specific metadata fields for enhanced filtering and analysis.
 */
export class CloudWatchFormatter extends JsonFormatter {
  /**
   * AWS region where the logs are being sent
   */
  private readonly region: string;

  /**
   * AWS account ID where the logs are being sent
   */
  private readonly accountId: string;

  /**
   * Creates a new CloudWatch formatter
   * @param region AWS region where the logs are being sent
   * @param accountId AWS account ID where the logs are being sent
   */
  constructor(region?: string, accountId?: string) {
    super();
    this.region = region || process.env.AWS_REGION || 'us-east-1';
    this.accountId = accountId || process.env.AWS_ACCOUNT_ID || '';
  }

  /**
   * Prepares the log entry for CloudWatch-specific formatting
   * @param entry The log entry to prepare
   * @returns A plain object ready for JSON serialization with CloudWatch optimizations
   */
  protected override prepareEntry(entry: LogEntry): Record<string, any> {
    // Start with the base JSON formatting
    const formattedEntry = super.prepareEntry(entry);

    // Add CloudWatch-specific fields with @ prefix for better querying
    formattedEntry['@timestamp'] = entry.timestamp.toISOString();
    formattedEntry['@message'] = entry.message;
    
    // Convert log level to a format that's easier to filter in CloudWatch
    formattedEntry['@level'] = this.formatLogLevel(entry.level);
    
    // Add AWS-specific metadata
    formattedEntry['@aws'] = {
      region: this.region,
      accountId: this.accountId,
      service: entry.serviceName || 'austa-superapp',
    };

    // Add request context in a CloudWatch-friendly format
    if (entry.requestId || entry.userId || entry.sessionId) {
      formattedEntry['@request'] = {};
      
      if (entry.requestId) {
        formattedEntry['@request'].id = entry.requestId;
      }
      
      if (entry.userId) {
        formattedEntry['@request'].userId = entry.userId;
      }
      
      if (entry.sessionId) {
        formattedEntry['@request'].sessionId = entry.sessionId;
      }

      if (entry.clientIp) {
        formattedEntry['@request'].clientIp = entry.clientIp;
      }

      if (entry.userAgent) {
        formattedEntry['@request'].userAgent = entry.userAgent;
      }
    }

    // Add trace information in a CloudWatch-friendly format
    if (entry.traceId || entry.spanId || entry.parentSpanId) {
      formattedEntry['@trace'] = {};
      
      if (entry.traceId) {
        formattedEntry['@trace'].traceId = entry.traceId;
      }
      
      if (entry.spanId) {
        formattedEntry['@trace'].spanId = entry.spanId;
      }
      
      if (entry.parentSpanId) {
        formattedEntry['@trace'].parentSpanId = entry.parentSpanId;
      }
    }

    // Add journey information in a CloudWatch-friendly format
    if (entry.journey) {
      formattedEntry['@journey'] = {
        type: entry.journey.type,
      };

      if (entry.journey.resourceId) {
        formattedEntry['@journey'].resourceId = entry.journey.resourceId;
      }

      if (entry.journey.action) {
        formattedEntry['@journey'].action = entry.journey.action;
      }

      // Add journey-specific fields for better filtering
      this.addJourneySpecificFields(formattedEntry, entry);
    }

    // Format error information for CloudWatch error detection
    if (entry.error) {
      formattedEntry['@error'] = {
        message: entry.error.message,
        name: entry.error.name || 'Error',
      };

      if (entry.error.code) {
        formattedEntry['@error'].code = entry.error.code;
      }

      if (entry.error.stack) {
        // Format stack trace for better readability in CloudWatch
        formattedEntry['@error'].stack = this.formatStackTrace(entry.error.stack);
      }

      // Add error classification for better filtering
      if (entry.error.isTransient !== undefined) {
        formattedEntry['@error'].isTransient = entry.error.isTransient;
      }

      if (entry.error.isClientError !== undefined) {
        formattedEntry['@error'].isClientError = entry.error.isClientError;
      }

      if (entry.error.isExternalError !== undefined) {
        formattedEntry['@error'].isExternalError = entry.error.isExternalError;
      }
    }

    return formattedEntry;
  }

  /**
   * Formats the log level for CloudWatch Logs Insights compatibility
   * @param level The log level to format
   * @returns The formatted log level string
   */
  private formatLogLevel(level: LogLevel): string {
    // Convert log level to uppercase string for better filtering
    return level.toString().toUpperCase();
  }

  /**
   * Formats a stack trace for better readability in CloudWatch
   * @param stack The stack trace to format
   * @returns The formatted stack trace
   */
  private formatStackTrace(stack: string): string {
    // Replace newlines with a special character that CloudWatch can display properly
    return stack.replace(/\n/g, '\r\n');
  }

  /**
   * Adds journey-specific fields to the formatted entry
   * @param formattedEntry The formatted entry to add fields to
   * @param entry The original log entry
   */
  private addJourneySpecificFields(formattedEntry: Record<string, any>, entry: LogEntry): void {
    if (!entry.journey) return;

    // Add journey-specific fields based on journey type
    switch (entry.journey.type) {
      case JourneyType.HEALTH:
        if (entry.journey.data) {
          // Add health-specific fields
          if (entry.journey.data.metricId) {
            formattedEntry['@journey'].metricId = entry.journey.data.metricId;
          }
          if (entry.journey.data.goalId) {
            formattedEntry['@journey'].goalId = entry.journey.data.goalId;
          }
          if (entry.journey.data.deviceId) {
            formattedEntry['@journey'].deviceId = entry.journey.data.deviceId;
          }
        }
        break;

      case JourneyType.CARE:
        if (entry.journey.data) {
          // Add care-specific fields
          if (entry.journey.data.appointmentId) {
            formattedEntry['@journey'].appointmentId = entry.journey.data.appointmentId;
          }
          if (entry.journey.data.providerId) {
            formattedEntry['@journey'].providerId = entry.journey.data.providerId;
          }
          if (entry.journey.data.medicationId) {
            formattedEntry['@journey'].medicationId = entry.journey.data.medicationId;
          }
        }
        break;

      case JourneyType.PLAN:
        if (entry.journey.data) {
          // Add plan-specific fields
          if (entry.journey.data.planId) {
            formattedEntry['@journey'].planId = entry.journey.data.planId;
          }
          if (entry.journey.data.benefitId) {
            formattedEntry['@journey'].benefitId = entry.journey.data.benefitId;
          }
          if (entry.journey.data.claimId) {
            formattedEntry['@journey'].claimId = entry.journey.data.claimId;
          }
        }
        break;
    }

    // Add journey data as a separate field for complex queries
    if (entry.journey.data && Object.keys(entry.journey.data).length > 0) {
      formattedEntry['@journey'].data = this.sanitizeObject(entry.journey.data);
    }
  }
}
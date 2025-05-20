import { Injectable } from '@nestjs/common';
import { JsonFormatter } from './json.formatter';
import { LogEntry } from './formatter.interface';

/**
 * CloudWatchFormatter extends the JsonFormatter with specific optimizations for AWS CloudWatch Logs.
 * 
 * It ensures logs are properly formatted for CloudWatch Logs Insights queries and adds AWS-specific
 * metadata fields for enhanced filtering and analysis. This formatter is optimized for use with
 * CloudWatch Logs Insights and provides better query capabilities in the AWS Console.
 *
 * Key features:
 * - Adds AWS-specific metadata fields for enhanced filtering
 * - Formats timestamps in a CloudWatch-optimized format
 * - Structures errors for better CloudWatch error detection
 * - Optimizes field names for CloudWatch Logs Insights queries
 * - Ensures compatibility with CloudWatch Logs Insights query syntax
 * 
 * Best practices implemented:
 * - Uses standardized field names for better query performance
 * - Structures logs for optimal CloudWatch Logs Insights filtering
 * - Formats timestamps in ISO format for proper time-based queries
 * - Adds journey-specific context for cross-service correlation
 * - Includes trace IDs for distributed tracing integration
 */
@Injectable()
export class CloudWatchFormatter extends JsonFormatter {
  /**
   * Formats a log entry for CloudWatch Logs with specific optimizations.
   * 
   * @param entry The log entry to format
   * @returns A formatted string ready for CloudWatch Logs
   */
  format(entry: LogEntry): string {
    // Create a copy of the entry to avoid modifying the original
    const cloudWatchEntry = { ...entry };

    // Add AWS-specific metadata fields for enhanced filtering
    // These fields are optimized for CloudWatch Logs Insights queries
    cloudWatchEntry.aws = {
      // Add service name for filtering across multiple services
      // This enables queries like: filter aws.service = "auth-service"
      service: cloudWatchEntry.context?.service || 'austa-service',
      
      // Add environment for filtering across environments
      // This enables queries like: filter aws.environment = "production"
      environment: process.env.NODE_ENV || 'development',
      
      // Add region for multi-region deployments
      // This enables queries like: filter aws.region = "us-east-1"
      region: process.env.AWS_REGION || 'us-east-1',
      
      // Add journey context for journey-specific filtering
      // This enables queries like: filter aws.journey = "health"
      journey: cloudWatchEntry.context?.journey || 'unknown',
    };

    // Format timestamp for CloudWatch indexing
    // CloudWatch works best with ISO strings for timestamp fields
    // This ensures proper time-based queries and visualization
    cloudWatchEntry.timestamp = new Date(cloudWatchEntry.timestamp || Date.now()).toISOString();

    // Add log level as a top-level field for easier filtering
    // This enables queries like: filter level = "ERROR"
    cloudWatchEntry.logLevel = cloudWatchEntry.level;

    // Enhance error formatting for CloudWatch error detection
    if (cloudWatchEntry.error) {
      // Ensure error is properly structured for CloudWatch error detection
      cloudWatchEntry.error = this.formatErrorForCloudWatch(cloudWatchEntry.error);
    }

    // Add request context in a CloudWatch-friendly format
    if (cloudWatchEntry.context?.request) {
      cloudWatchEntry.request = {
        // Request ID for correlation across logs
        // This enables queries like: filter request.id = "abc-123"
        id: cloudWatchEntry.context.request.id,
        
        // HTTP method for filtering by request type
        // This enables queries like: filter request.method = "POST"
        method: cloudWatchEntry.context.request.method,
        
        // Request path for endpoint-specific filtering
        // This enables queries like: filter request.path like "/api/health"
        path: cloudWatchEntry.context.request.path,
        
        // Add user ID for user-specific filtering
        // This enables queries like: filter request.userId = "user-123"
        userId: cloudWatchEntry.context.request.userId,
        
        // Add duration for performance analysis
        // This enables queries like: filter request.duration > 1000
        duration: cloudWatchEntry.context.request.duration,
      };
    }

    // Add trace context for distributed tracing correlation
    if (cloudWatchEntry.context?.trace) {
      cloudWatchEntry.trace = {
        // Trace ID for correlation across services
        // This enables queries like: filter trace.id = "trace-123"
        id: cloudWatchEntry.context.trace.id,
        
        // Span ID for operation-specific tracing
        // This enables queries like: filter trace.spanId = "span-123"
        spanId: cloudWatchEntry.context.trace.spanId,
        
        // Parent span ID for trace hierarchy
        // This enables queries like: filter trace.parentSpanId = "parent-span-123"
        parentSpanId: cloudWatchEntry.context.trace.parentSpanId,
      };
    }

    // Use the parent JsonFormatter to convert to JSON string
    return super.format(cloudWatchEntry);
  }

  /**
   * Formats an error object for optimal CloudWatch error detection and analysis.
   * Structures errors to be easily queryable in CloudWatch Logs Insights.
   * 
   * @param error The error object to format
   * @returns A CloudWatch-optimized error object
   */
  private formatErrorForCloudWatch(error: any): any {
    if (!error) {
      return null;
    }

    // If it's already a string, return it
    if (typeof error === 'string') {
      return error;
    }

    // Create a structured error object optimized for CloudWatch
    // This structure enables powerful error filtering and analysis
    const formattedError: any = {
      // Error message for text-based filtering
      // This enables queries like: filter error.message like "database connection"
      message: error.message || 'Unknown error',
      
      // Error name/type for categorization
      // This enables queries like: filter error.name = "ValidationError"
      name: error.name || 'Error',
      
      // CloudWatch has special handling for the 'stack' field
      // This enables better error tracing in CloudWatch
      stack: error.stack || '',
    };

    // Add error code if available for filtering
    // This enables queries like: filter error.code = "RESOURCE_NOT_FOUND"
    if (error.code) {
      formattedError.code = error.code;
    }

    // Add status code if available for HTTP errors
    // This enables queries like: filter error.statusCode = 404
    if (error.statusCode) {
      formattedError.statusCode = error.statusCode;
    }

    // Add additional error details if available
    // This enables deeper error analysis in CloudWatch
    if (error.details) {
      formattedError.details = error.details;
    }

    // Add journey context if available
    // This enables journey-specific error filtering
    // This enables queries like: filter error.journey = "health"
    if (error.journey) {
      formattedError.journey = error.journey;
    }

    return formattedError;
  }
}
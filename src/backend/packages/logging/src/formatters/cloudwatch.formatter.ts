import { Injectable } from '@nestjs/common';
import { LogEntry, ErrorObject } from '../interfaces/log-entry.interface';
import { JsonFormatter } from './json.formatter';

/**
 * Specialized formatter for AWS CloudWatch Logs that extends the JSON formatter
 * with CloudWatch-specific optimizations.
 * 
 * This formatter ensures logs are properly formatted for CloudWatch Logs Insights queries
 * and adds AWS-specific metadata fields for enhanced filtering and analysis.
 */
@Injectable()
export class CloudWatchFormatter extends JsonFormatter {
  /**
   * Formats a log entry into a CloudWatch-optimized JSON string representation.
   * @param entry The log entry to format
   * @returns The formatted log entry as a CloudWatch-optimized JSON string
   */
  format(entry: LogEntry): string {
    // Create a CloudWatch-optimized log entry
    const cloudwatchEntry = {
      // CloudWatch uses '@timestamp' as a special field for indexing
      '@timestamp': entry.timestamp.toISOString(),
      
      // Standard log fields
      level: entry.level,
      message: entry.message,
      service: entry.service,
      
      // Context information - flattened for better CloudWatch Logs Insights queries
      ...this.flattenContext(entry.context || {}),
      
      // Correlation IDs for distributed tracing
      requestId: entry.requestId,
      userId: entry.userId,
      traceId: entry.traceId,
      spanId: entry.spanId,
      parentSpanId: entry.parentSpanId,
      
      // Journey information
      journey: entry.journey,
      
      // Flatten journey context for better CloudWatch Logs Insights queries
      ...this.flattenJourneyContext(entry.journeyContext),
      
      // AWS-specific metadata fields
      aws: {
        region: process.env.AWS_REGION || 'unknown',
        accountId: process.env.AWS_ACCOUNT_ID || 'unknown',
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        executionEnv: process.env.AWS_EXECUTION_ENV,
      },
      
      // Environment information
      environment: process.env.NODE_ENV || 'development',
      
      // Error information (if present) - formatted for CloudWatch error detection
      ...this.formatCloudWatchError(entry.error),
    };
    
    return JSON.stringify(cloudwatchEntry);
  }
  
  /**
   * Flattens context object for better CloudWatch Logs Insights queries.
   * @param context The context object to flatten
   * @returns Flattened context with dot notation for nested properties
   */
  private flattenContext(context: Record<string, any>): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    // If context is empty, return empty object
    if (!context || Object.keys(context).length === 0) {
      return flattened;
    }
    
    // Add context with 'ctx.' prefix for better filtering in CloudWatch
    Object.entries(context).forEach(([key, value]) => {
      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }
      
      // Handle simple values directly
      if (typeof value !== 'object' || value instanceof Date) {
        flattened[`ctx.${key}`] = value instanceof Date ? value.toISOString() : value;
        return;
      }
      
      // Handle arrays by converting to string to avoid complex nested structures
      if (Array.isArray(value)) {
        flattened[`ctx.${key}`] = JSON.stringify(value);
        return;
      }
      
      // Handle nested objects by flattening with dot notation
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue === undefined || nestedValue === null) {
          return;
        }
        
        // Convert complex nested values to strings
        if (typeof nestedValue === 'object' && !(nestedValue instanceof Date)) {
          flattened[`ctx.${key}.${nestedKey}`] = JSON.stringify(nestedValue);
        } else {
          flattened[`ctx.${key}.${nestedKey}`] = nestedValue instanceof Date ? 
            nestedValue.toISOString() : nestedValue;
        }
      });
    });
    
    return flattened;
  }
  
  /**
   * Flattens journey context for better CloudWatch Logs Insights queries.
   * @param journeyContext The journey context to flatten
   * @returns Flattened journey context with dot notation
   */
  private flattenJourneyContext(journeyContext?: Record<string, any>): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    // If journey context is empty, return empty object
    if (!journeyContext || Object.keys(journeyContext).length === 0) {
      return flattened;
    }
    
    // Add journey ID and step directly for common filtering
    if (journeyContext.journeyId) {
      flattened['journeyId'] = journeyContext.journeyId;
    }
    
    if (journeyContext.step) {
      flattened['journeyStep'] = journeyContext.step;
    }
    
    // Process health journey context
    if (journeyContext.health) {
      Object.entries(journeyContext.health).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flattened[`health.${key}`] = value;
        }
      });
    }
    
    // Process care journey context
    if (journeyContext.care) {
      Object.entries(journeyContext.care).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flattened[`care.${key}`] = value;
        }
      });
    }
    
    // Process plan journey context
    if (journeyContext.plan) {
      Object.entries(journeyContext.plan).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flattened[`plan.${key}`] = value;
        }
      });
    }
    
    return flattened;
  }
  
  /**
   * Formats error information specifically for CloudWatch error detection.
   * @param error The error object to format
   * @returns CloudWatch-optimized error object
   */
  private formatCloudWatchError(error?: ErrorObject): Record<string, any> {
    if (!error) {
      return {};
    }
    
    // CloudWatch has special handling for 'error' field
    return {
      // Add 'error' as a top-level field for CloudWatch error detection
      error: error.message,
      
      // Add detailed error information in a structured format
      errorDetails: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        details: error.details,
        // Format nested cause if present
        cause: error.cause ? this.formatError(error.cause) : undefined,
      },
      
      // Add error type for easier filtering
      errorType: error.isOperational ? 'operational' : 'programmatic',
      
      // Add error code for filtering if available
      errorCode: error.code,
      
      // Add HTTP status code for API errors if available
      statusCode: error.statusCode,
    };
  }
}
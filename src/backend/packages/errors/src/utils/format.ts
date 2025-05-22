/**
 * Error formatting utilities for standardized error messages across the AUSTA SuperApp.
 * Provides functions for creating user-friendly error messages with journey context,
 * template-based message generation, and technical error translation.
 */

import { ErrorType } from '../categories/error-types';

/**
 * Journey types supported by the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  SYSTEM = 'system'
}

/**
 * Interface for error context information
 */
export interface ErrorContext {
  journeyType?: JourneyType;
  userId?: string;
  requestId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for template variables used in error message formatting
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Creates a journey-aware error message with appropriate context.
 * Formats the message to be more user-friendly based on the journey type.
 *
 * @param message - The base error message
 * @param context - The error context including journey type
 * @returns Formatted error message with journey context
 */
export function formatJourneyError(message: string, context: ErrorContext): string {
  const { journeyType, userId, requestId } = context;
  const timestamp = context.timestamp || new Date();
  
  // Format timestamp as ISO string
  const formattedTime = timestamp.toISOString();
  
  // Create journey-specific prefix
  let journeyPrefix = '';
  
  if (journeyType) {
    switch (journeyType) {
      case JourneyType.HEALTH:
        journeyPrefix = 'Health Journey';
        break;
      case JourneyType.CARE:
        journeyPrefix = 'Care Journey';
        break;
      case JourneyType.PLAN:
        journeyPrefix = 'Plan Journey';
        break;
      case JourneyType.GAMIFICATION:
        journeyPrefix = 'Gamification';
        break;
      case JourneyType.SYSTEM:
      default:
        journeyPrefix = 'System';
        break;
    }
  }
  
  // Build the formatted message
  let formattedMessage = `${journeyPrefix}: ${message}`;
  
  // Add debug information in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const debugInfo = [];
    if (userId) debugInfo.push(`User: ${userId}`);
    if (requestId) debugInfo.push(`Request: ${requestId}`);
    debugInfo.push(`Time: ${formattedTime}`);
    
    if (debugInfo.length > 0) {
      formattedMessage += ` (${debugInfo.join(', ')})`;
    }
  }
  
  return formattedMessage;
}

/**
 * Formats an error code with journey prefix for consistent error codes across the application.
 *
 * @param code - The base error code
 * @param journeyType - The journey type
 * @returns Formatted error code with journey prefix
 */
export function formatErrorCode(code: string, journeyType?: JourneyType): string {
  // If code already has a journey prefix, return as is
  if (/^[A-Z]+_\d+$/.test(code)) {
    return code;
  }
  
  // Default prefix
  let prefix = 'SYS';
  
  // Set prefix based on journey type
  if (journeyType) {
    switch (journeyType) {
      case JourneyType.HEALTH:
        prefix = 'HEALTH';
        break;
      case JourneyType.CARE:
        prefix = 'CARE';
        break;
      case JourneyType.PLAN:
        prefix = 'PLAN';
        break;
      case JourneyType.GAMIFICATION:
        prefix = 'GAME';
        break;
      case JourneyType.SYSTEM:
        prefix = 'SYS';
        break;
    }
  }
  
  // Ensure code is numeric or convert to a numeric format
  let numericCode = code;
  if (!/^\d+$/.test(code)) {
    // Hash the string to create a numeric code
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash) + code.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    numericCode = Math.abs(hash % 10000).toString().padStart(4, '0');
  } else {
    // Ensure numeric code is at least 4 digits
    numericCode = code.padStart(4, '0');
  }
  
  return `${prefix}_${numericCode}`;
}

/**
 * Translates technical error messages into user-friendly messages based on error type.
 *
 * @param message - The original technical error message
 * @param errorType - The type of error
 * @param journeyType - The journey type for context-specific messaging
 * @returns User-friendly error message
 */
export function translateErrorMessage(
  message: string,
  errorType: ErrorType,
  journeyType?: JourneyType
): string {
  // Default user-friendly message
  let userFriendlyMessage = 'An unexpected error occurred. Please try again later.';
  
  // Journey-specific context
  let journeyContext = '';
  if (journeyType) {
    switch (journeyType) {
      case JourneyType.HEALTH:
        journeyContext = 'while accessing your health information';
        break;
      case JourneyType.CARE:
        journeyContext = 'while managing your care services';
        break;
      case JourneyType.PLAN:
        journeyContext = 'while accessing your plan details';
        break;
      case JourneyType.GAMIFICATION:
        journeyContext = 'while processing your achievements';
        break;
      default:
        journeyContext = '';
        break;
    }
  }
  
  // Translate based on error type
  switch (errorType) {
    case ErrorType.VALIDATION:
      // For validation errors, keep the original message as it's usually user-actionable
      userFriendlyMessage = message;
      break;
      
    case ErrorType.BUSINESS:
      // Business errors are usually already in user-friendly language
      userFriendlyMessage = message;
      break;
      
    case ErrorType.EXTERNAL:
      // External system errors
      userFriendlyMessage = `We're having trouble connecting to an external service ${journeyContext}. Please try again later.`;
      
      // Include more details in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        userFriendlyMessage += ` (Details: ${message})`;
      }
      break;
      
    case ErrorType.TECHNICAL:
      // Technical errors should be generic for users but logged in detail
      userFriendlyMessage = `A system error occurred ${journeyContext}. Our team has been notified.`;
      
      // Include more details in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        userFriendlyMessage += ` (Technical details: ${message})`;
      }
      break;
  }
  
  return userFriendlyMessage;
}

/**
 * Generates an error message from a template with variable substitution.
 * Uses the format: "Error message with {variable}" where {variable} is replaced with the value.
 *
 * @param template - The message template with variables in {varName} format
 * @param variables - Object containing variable values to substitute
 * @returns Formatted message with variables substituted
 */
export function formatTemplate(template: string, variables: TemplateVariables): string {
  // Replace each {variable} with its value
  return template.replace(/\{([\w.]+)\}/g, (match, key) => {
    // Handle nested properties with dot notation (e.g., {user.name})
    const keys = key.split('.');
    let value: any = variables;
    
    for (const k of keys) {
      if (value === undefined || value === null) {
        break;
      }
      value = value[k];
    }
    
    // Return the value or the original placeholder if value is undefined
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Creates a detailed error context object with journey information and metadata.
 *
 * @param journeyType - The journey type
 * @param metadata - Additional contextual information
 * @param userId - User ID if available
 * @param requestId - Request ID for tracing
 * @returns Complete error context object
 */
export function createErrorContext(
  journeyType?: JourneyType,
  metadata?: Record<string, any>,
  userId?: string,
  requestId?: string
): ErrorContext {
  return {
    journeyType,
    userId,
    requestId,
    timestamp: new Date(),
    metadata
  };
}

/**
 * Formats an error object into a standardized structure for API responses.
 *
 * @param message - The error message
 * @param code - The error code
 * @param errorType - The type of error
 * @param context - Error context information
 * @param details - Additional error details
 * @returns Formatted error object for API responses
 */
export function formatErrorResponse(
  message: string,
  code: string,
  errorType: ErrorType,
  context?: ErrorContext,
  details?: Record<string, any>
): Record<string, any> {
  // Format the error code with journey prefix if context is provided
  const formattedCode = context?.journeyType 
    ? formatErrorCode(code, context.journeyType)
    : formatErrorCode(code);
  
  // Translate the error message to be user-friendly
  const userFriendlyMessage = translateErrorMessage(message, errorType, context?.journeyType);
  
  // Create the base error response
  const errorResponse = {
    error: {
      type: errorType,
      code: formattedCode,
      message: userFriendlyMessage
    }
  };
  
  // Add details if provided and not in production
  if (details && Object.keys(details).length > 0) {
    if (process.env.NODE_ENV !== 'production') {
      (errorResponse.error as any).details = details;
    }
  }
  
  // Add journey information if available
  if (context?.journeyType) {
    (errorResponse.error as any).journey = context.journeyType;
  }
  
  return errorResponse;
}
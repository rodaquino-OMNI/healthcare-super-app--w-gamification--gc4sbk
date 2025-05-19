import { ErrorType } from '@austa/interfaces/common/dto/error.dto';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Interface for error context information that enhances error messages
 */
export interface ErrorContext {
  journeyType?: JourneyType;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  requestId?: string;
  timestamp?: Date;
  locale?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Interface for user action suggestions based on error type
 */
export interface ErrorActionSuggestion {
  message: string;
  actionType: 'retry' | 'contact_support' | 'check_input' | 'wait' | 'refresh' | 'logout_login' | 'custom';
  actionLink?: string;
  customAction?: string;
}

/**
 * Interface for a formatted error response
 */
export interface FormattedError {
  message: string;
  localizedMessage?: string;
  code: string;
  type: ErrorType;
  details?: Record<string, any>;
  suggestions?: ErrorActionSuggestion[];
  context?: Partial<ErrorContext>;
}

/**
 * Error code to message mapping type
 */
type ErrorCodeMessageMap = Record<string, string>;

/**
 * Journey-specific error message maps
 */
const healthJourneyErrors: ErrorCodeMessageMap = {
  'HEALTH_DATA_NOT_FOUND': 'The requested health data could not be found',
  'HEALTH_GOAL_INVALID': 'The health goal parameters are invalid',
  'DEVICE_CONNECTION_FAILED': 'Failed to connect to your health device',
  'HEALTH_METRIC_INVALID': 'The health metric data is invalid or out of expected range',
  'HEALTH_SYNC_FAILED': 'Failed to synchronize your health data',
  'HEALTH_INSIGHT_UNAVAILABLE': 'Health insights are temporarily unavailable',
};

const careJourneyErrors: ErrorCodeMessageMap = {
  'APPOINTMENT_NOT_FOUND': 'The requested appointment could not be found',
  'APPOINTMENT_SLOT_UNAVAILABLE': 'The selected appointment slot is no longer available',
  'PROVIDER_NOT_FOUND': 'The healthcare provider could not be found',
  'TELEMEDICINE_SESSION_FAILED': 'The telemedicine session could not be established',
  'MEDICATION_NOT_FOUND': 'The requested medication information could not be found',
  'TREATMENT_PLAN_INVALID': 'The treatment plan contains invalid parameters',
};

const planJourneyErrors: ErrorCodeMessageMap = {
  'PLAN_NOT_FOUND': 'The requested insurance plan could not be found',
  'BENEFIT_NOT_COVERED': 'This benefit is not covered by your current plan',
  'CLAIM_SUBMISSION_FAILED': 'Your claim submission could not be processed',
  'DOCUMENT_UPLOAD_FAILED': 'The document upload failed',
  'COVERAGE_VERIFICATION_FAILED': 'Coverage verification failed',
  'PLAN_COMPARISON_UNAVAILABLE': 'Plan comparison is temporarily unavailable',
};

const commonErrors: ErrorCodeMessageMap = {
  'VALIDATION_ERROR': 'The provided data is invalid',
  'AUTHENTICATION_FAILED': 'Authentication failed',
  'AUTHORIZATION_FAILED': 'You do not have permission to perform this action',
  'RESOURCE_NOT_FOUND': 'The requested resource could not be found',
  'SERVICE_UNAVAILABLE': 'The service is temporarily unavailable',
  'NETWORK_ERROR': 'A network error occurred',
  'INTERNAL_ERROR': 'An internal error occurred',
  'REQUEST_TIMEOUT': 'The request timed out',
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded, please try again later',
  'INVALID_INPUT': 'The provided input is invalid',
};

/**
 * Maps error codes to journey-specific error messages
 */
const journeyErrorMaps: Record<JourneyType, ErrorCodeMessageMap> = {
  [JourneyType.HEALTH]: healthJourneyErrors,
  [JourneyType.CARE]: careJourneyErrors,
  [JourneyType.PLAN]: planJourneyErrors,
};

/**
 * Generates user action suggestions based on error type and context
 */
export function generateErrorSuggestions(
  errorType: ErrorType,
  errorCode: string,
  context?: ErrorContext
): ErrorActionSuggestion[] {
  const suggestions: ErrorActionSuggestion[] = [];

  // Common suggestions based on error type
  switch (errorType) {
    case ErrorType.VALIDATION:
      suggestions.push({
        message: 'Please check your input and try again',
        actionType: 'check_input',
      });
      break;
    case ErrorType.BUSINESS:
      suggestions.push({
        message: 'Please review the requirements and try again',
        actionType: 'check_input',
      });
      break;
    case ErrorType.EXTERNAL:
      suggestions.push({
        message: 'Please try again later',
        actionType: 'wait',
      });
      break;
    case ErrorType.TECHNICAL:
      suggestions.push({
        message: 'Please contact support if the problem persists',
        actionType: 'contact_support',
      });
      break;
  }

  // Journey-specific suggestions
  if (context?.journeyType) {
    switch (context.journeyType) {
      case JourneyType.HEALTH:
        if (errorCode === 'DEVICE_CONNECTION_FAILED') {
          suggestions.push({
            message: 'Check if your device is turned on and within range',
            actionType: 'custom',
            customAction: 'checkDeviceConnection',
          });
        } else if (errorCode === 'HEALTH_SYNC_FAILED') {
          suggestions.push({
            message: 'Try manually syncing your device',
            actionType: 'custom',
            customAction: 'manualSync',
          });
        }
        break;
      case JourneyType.CARE:
        if (errorCode === 'APPOINTMENT_SLOT_UNAVAILABLE') {
          suggestions.push({
            message: 'Please select another appointment time',
            actionType: 'custom',
            customAction: 'selectNewAppointment',
          });
        } else if (errorCode === 'TELEMEDICINE_SESSION_FAILED') {
          suggestions.push({
            message: 'Check your internet connection and camera permissions',
            actionType: 'custom',
            customAction: 'checkTelemedicineRequirements',
          });
        }
        break;
      case JourneyType.PLAN:
        if (errorCode === 'CLAIM_SUBMISSION_FAILED') {
          suggestions.push({
            message: 'Ensure all required documents are attached',
            actionType: 'custom',
            customAction: 'reviewClaimDocuments',
          });
        } else if (errorCode === 'DOCUMENT_UPLOAD_FAILED') {
          suggestions.push({
            message: 'Check that your document is in a supported format (PDF, JPG, PNG)',
            actionType: 'custom',
            customAction: 'checkDocumentFormat',
          });
        }
        break;
    }
  }

  // Add generic retry suggestion for certain error types
  if (
    errorType === ErrorType.EXTERNAL ||
    (errorType === ErrorType.TECHNICAL && errorCode !== 'INTERNAL_ERROR')
  ) {
    suggestions.push({
      message: 'Try again',
      actionType: 'retry',
    });
  }

  return suggestions;
}

/**
 * Gets the appropriate error message for an error code, considering journey context
 */
export function getErrorMessage(errorCode: string, journeyType?: JourneyType): string {
  // Check journey-specific error messages first if journey type is provided
  if (journeyType && journeyErrorMaps[journeyType][errorCode]) {
    return journeyErrorMaps[journeyType][errorCode];
  }

  // Fall back to common error messages
  return commonErrors[errorCode] || `Error: ${errorCode}`;
}

/**
 * Translates an error message to the specified locale
 * Note: This is a placeholder for actual i18n implementation
 */
export function translateErrorMessage(message: string, locale?: string): string {
  // This would be replaced with actual i18n translation logic
  // For now, we just return the original message
  return message;
}

/**
 * Enhances error details with context information
 */
export function enhanceErrorWithContext(
  details: Record<string, any> | undefined,
  context?: ErrorContext
): Record<string, any> {
  if (!details) {
    details = {};
  }

  const enhancedDetails = { ...details };

  // Add relevant context information to the error details
  if (context) {
    if (context.resourceId && context.resourceType) {
      enhancedDetails.resource = {
        id: context.resourceId,
        type: context.resourceType,
      };
    }

    if (context.requestId) {
      enhancedDetails.requestId = context.requestId;
    }

    if (context.timestamp) {
      enhancedDetails.timestamp = context.timestamp.toISOString();
    }

    if (context.additionalInfo) {
      enhancedDetails.additionalInfo = context.additionalInfo;
    }
  }

  return enhancedDetails;
}

/**
 * Formats an error with user-friendly messages, localization, and context
 */
export function formatError(
  errorCode: string,
  errorType: ErrorType,
  details?: Record<string, any>,
  context?: ErrorContext
): FormattedError {
  // Get the appropriate error message based on journey context
  const message = getErrorMessage(errorCode, context?.journeyType);

  // Translate the message if locale is provided
  const localizedMessage = context?.locale
    ? translateErrorMessage(message, context.locale)
    : undefined;

  // Enhance error details with context
  const enhancedDetails = enhanceErrorWithContext(details, context);

  // Generate user action suggestions
  const suggestions = generateErrorSuggestions(errorType, errorCode, context);

  // Create the formatted error response
  return {
    message,
    localizedMessage,
    code: errorCode,
    type: errorType,
    details: Object.keys(enhancedDetails).length > 0 ? enhancedDetails : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    context: context ? {
      journeyType: context.journeyType,
      requestId: context.requestId,
      timestamp: context.timestamp,
    } : undefined,
  };
}

/**
 * Creates a formatted validation error
 */
export function createValidationError(
  details: Record<string, any>,
  context?: ErrorContext
): FormattedError {
  return formatError('VALIDATION_ERROR', ErrorType.VALIDATION, details, context);
}

/**
 * Creates a formatted business error
 */
export function createBusinessError(
  errorCode: string,
  details?: Record<string, any>,
  context?: ErrorContext
): FormattedError {
  return formatError(errorCode, ErrorType.BUSINESS, details, context);
}

/**
 * Creates a formatted technical error
 */
export function createTechnicalError(
  errorCode: string = 'INTERNAL_ERROR',
  details?: Record<string, any>,
  context?: ErrorContext
): FormattedError {
  return formatError(errorCode, ErrorType.TECHNICAL, details, context);
}

/**
 * Creates a formatted external system error
 */
export function createExternalError(
  errorCode: string,
  details?: Record<string, any>,
  context?: ErrorContext
): FormattedError {
  return formatError(errorCode, ErrorType.EXTERNAL, details, context);
}

/**
 * Creates a journey-specific error with appropriate context
 */
export function createJourneyError(
  journeyType: JourneyType,
  errorCode: string,
  errorType: ErrorType,
  details?: Record<string, any>,
  additionalContext?: Partial<ErrorContext>
): FormattedError {
  const context: ErrorContext = {
    journeyType,
    timestamp: new Date(),
    ...additionalContext,
  };

  return formatError(errorCode, errorType, details, context);
}
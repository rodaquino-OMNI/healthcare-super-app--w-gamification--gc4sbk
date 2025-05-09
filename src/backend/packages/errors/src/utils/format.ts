/**
 * @file Error message formatting utilities
 * 
 * This module provides utilities for formatting error messages with contextual information,
 * improving error clarity for both developers and end-users. It includes functions for
 * creating standardized error messages with journey context, user-friendly translations
 * of technical errors, error code formatting, and template-based error message generation
 * with variable substitution.
 */

import { ErrorType } from '../types';

/**
 * Journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  COMMON = 'common',
  GAMIFICATION = 'gamification'
}

/**
 * Journey display names for user-friendly messages
 */
export const JOURNEY_DISPLAY_NAMES = {
  [JourneyType.HEALTH]: 'Minha Saúde',
  [JourneyType.CARE]: 'Cuidar-me Agora',
  [JourneyType.PLAN]: 'Meu Plano & Benefícios',
  [JourneyType.GAMIFICATION]: 'Gamificação',
  [JourneyType.COMMON]: 'AUSTA SuperApp'
};

/**
 * Language options for error messages
 */
export enum ErrorMessageLanguage {
  PT = 'pt',
  EN = 'en'
}

/**
 * Default language for error messages
 */
export const DEFAULT_ERROR_LANGUAGE = ErrorMessageLanguage.PT;

/**
 * Error context information used for formatting error messages
 */
export interface ErrorContext {
  journey?: JourneyType;
  userId?: string;
  requestId?: string;
  timestamp?: Date;
  language?: ErrorMessageLanguage;
  metadata?: Record<string, any>;
}

/**
 * Template variables for error message formatting
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Formats an error code with the appropriate prefix based on journey type
 * 
 * @param code - The error code without prefix
 * @param journey - The journey type
 * @returns Formatted error code with journey prefix
 */
export function formatErrorCode(code: string, journey?: JourneyType): string {
  // If code already has a prefix (contains underscore), return as is
  if (code.includes('_')) {
    return code;
  }
  
  // Add appropriate prefix based on journey
  const prefix = journey ? journeyToPrefix(journey) : 'APP';
  return `${prefix}_${code}`;
}

/**
 * Converts a journey type to a code prefix
 * 
 * @param journey - The journey type
 * @returns The code prefix for the journey
 */
function journeyToPrefix(journey: JourneyType): string {
  switch (journey) {
    case JourneyType.HEALTH:
      return 'HEALTH';
    case JourneyType.CARE:
      return 'CARE';
    case JourneyType.PLAN:
      return 'PLAN';
    case JourneyType.GAMIFICATION:
      return 'GAMIF';
    case JourneyType.COMMON:
    default:
      return 'APP';
  }
}

/**
 * Creates a user-friendly error message with journey context
 * 
 * @param message - The base error message
 * @param context - Error context information
 * @returns A user-friendly error message with journey context
 */
export function formatUserFriendlyMessage(message: string, context?: ErrorContext): string {
  if (!context || !context.journey) {
    return message;
  }
  
  const journeyName = JOURNEY_DISPLAY_NAMES[context.journey] || JOURNEY_DISPLAY_NAMES[JourneyType.COMMON];
  
  return `${journeyName}: ${message}`;
}

/**
 * Formats an error message template by replacing variables
 * 
 * @param template - The message template with placeholders like {{variable}}
 * @param variables - The variables to substitute in the template
 * @returns Formatted message with variables substituted
 */
export function formatTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    // Handle nested properties with dot notation (e.g., {{user.name}})
    const value = key.split('.').reduce((obj: any, prop: string) => {
      return obj && typeof obj === 'object' ? obj[prop] : undefined;
    }, variables);
    
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Creates a journey-specific error message using a template
 * 
 * @param template - The message template with placeholders
 * @param variables - The variables to substitute in the template
 * @param context - Error context information
 * @returns A formatted error message with journey context and substituted variables
 */
export function formatJourneyTemplate(
  template: string,
  variables: TemplateVariables,
  context?: ErrorContext
): string {
  const formattedMessage = formatTemplate(template, variables);
  return formatUserFriendlyMessage(formattedMessage, context);
}

/**
 * Creates a template-based error message with sanitized variables
 * 
 * @param template - The message template with placeholders
 * @param variables - The variables to substitute in the template
 * @param sanitize - Whether to sanitize the variables (default: true)
 * @returns Formatted message with variables substituted and sanitized
 */
export function formatSafeTemplate(
  template: string,
  variables: TemplateVariables,
  sanitize = true
): string {
  if (!sanitize) {
    return formatTemplate(template, variables);
  }
  
  // Create a sanitized copy of the variables
  const sanitizedVariables: TemplateVariables = {};
  
  for (const [key, value] of Object.entries(variables)) {
    if (value === null || value === undefined) {
      sanitizedVariables[key] = '';
      continue;
    }
    
    if (typeof value === 'string') {
      // Basic HTML sanitization
      sanitizedVariables[key] = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else {
      sanitizedVariables[key] = value;
    }
  }
  
  return formatTemplate(template, sanitizedVariables);
}

/**
 * Translates a technical error message to a user-friendly message
 * 
 * @param errorType - The type of error
 * @param technicalMessage - The original technical error message
 * @param context - Error context information
 * @returns A user-friendly error message
 */
/**
 * Error messages by type and language
 */
const ERROR_MESSAGES = {
  [ErrorMessageLanguage.PT]: {
    [ErrorType.VALIDATION]: 'Os dados fornecidos são inválidos. Por favor, verifique e tente novamente.',
    [ErrorType.BUSINESS]: 'Não foi possível completar a operação devido a uma regra de negócio.',
    [ErrorType.TECHNICAL]: 'Ocorreu um erro técnico. Nossa equipe foi notificada e está trabalhando na solução.',
    [ErrorType.EXTERNAL]: 'Não foi possível conectar a um serviço externo. Por favor, tente novamente mais tarde.',
    default: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  },
  [ErrorMessageLanguage.EN]: {
    [ErrorType.VALIDATION]: 'The provided data is invalid. Please check and try again.',
    [ErrorType.BUSINESS]: 'The operation could not be completed due to a business rule.',
    [ErrorType.TECHNICAL]: 'A technical error occurred. Our team has been notified and is working on a solution.',
    [ErrorType.EXTERNAL]: 'Could not connect to an external service. Please try again later.',
    default: 'An unexpected error occurred. Please try again.'
  }
};

/**
 * Translates a technical error message to a user-friendly message
 * 
 * @param errorType - The type of error
 * @param technicalMessage - The original technical error message
 * @param context - Error context information
 * @returns A user-friendly error message
 */
export function translateTechnicalError(
  errorType: ErrorType,
  technicalMessage: string,
  context?: ErrorContext
): string {
  // Determine language to use
  const language = context?.language || DEFAULT_ERROR_LANGUAGE;
  
  // Get messages for the selected language
  const messages = ERROR_MESSAGES[language] || ERROR_MESSAGES[DEFAULT_ERROR_LANGUAGE];
  
  // Get the appropriate message for the error type
  const userFriendlyMessage = messages[errorType] || messages.default;
  
  // Add journey context if available
  return formatUserFriendlyMessage(userFriendlyMessage, context);
}

/**
 * Creates a detailed error message with context for logging
 * 
 * @param message - The base error message
 * @param context - Error context information
 * @returns A detailed error message with context for logging
 */
export function formatDetailedErrorMessage(message: string, context?: ErrorContext): string {
  if (!context) {
    return message;
  }
  
  const parts: string[] = [message];
  
  if (context.journey) {
    parts.push(`Journey: ${context.journey}`);
  }
  
  if (context.userId) {
    parts.push(`User: ${context.userId}`);
  }
  
  if (context.requestId) {
    parts.push(`Request: ${context.requestId}`);
  }
  
  if (context.timestamp) {
    parts.push(`Time: ${context.timestamp.toISOString()}`);
  }
  
  if (context.metadata && Object.keys(context.metadata).length > 0) {
    const metadataStr = Object.entries(context.metadata)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
    
    parts.push(`Metadata: {${metadataStr}}`);
  }
  
  return parts.join(' | ');
}

/**
 * Formats an error message for client response based on environment
 * 
 * @param message - The error message
 * @param technicalDetails - Technical details to include in non-production environments
 * @returns Formatted error message for client response
 */
export function formatClientErrorMessage(
  message: string,
  technicalDetails?: string
): string {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd || !technicalDetails) {
    return message;
  }
  
  return `${message} (${technicalDetails})`;
}

/**
 * Extracts a user-friendly field name from a validation path
 * 
 * @param fieldPath - The validation path (e.g., 'user.address.zipCode')
 * @returns A user-friendly field name
 */
export function formatFieldName(fieldPath: string): string {
  // Convert camelCase to space-separated words
  const formatted = fieldPath
    .split('.')
    .pop() // Get the last part of the path
    ?.replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
  
  return formatted || fieldPath;
}

/**
 * Creates a journey-specific validation error message
 * 
 * @param fieldName - The name of the field with validation error
 * @param errorMessage - The specific validation error message
 * @param journey - The journey type
 * @returns A formatted validation error message with journey context
 */
export function formatValidationError(
  fieldName: string,
  errorMessage: string,
  journey?: JourneyType
): string {
  const formattedField = formatFieldName(fieldName);
  const baseMessage = `${formattedField}: ${errorMessage}`;
  
  return formatUserFriendlyMessage(baseMessage, { journey });
}

/**
 * Formats an error message for a specific HTTP status code
 * 
 * @param statusCode - The HTTP status code
 * @param defaultMessage - Default message to use if no specific message is found
 * @param context - Error context information
 * @returns A formatted error message for the HTTP status code
 */
/**
 * HTTP status messages by status code and language
 */
const HTTP_STATUS_MESSAGES = {
  [ErrorMessageLanguage.PT]: {
    400: 'A solicitação contém dados inválidos ou mal formatados.',
    401: 'Autenticação necessária para acessar este recurso.',
    403: 'Você não tem permissão para acessar este recurso.',
    404: 'O recurso solicitado não foi encontrado.',
    409: 'A operação não pode ser concluída devido a um conflito de dados.',
    422: 'A solicitação está bem formatada, mas contém erros semânticos.',
    429: 'Muitas solicitações. Por favor, tente novamente mais tarde.',
    500: 'Ocorreu um erro interno no servidor. Nossa equipe foi notificada.',
    502: 'Não foi possível obter resposta de um serviço necessário.',
    503: 'O serviço está temporariamente indisponível. Por favor, tente novamente mais tarde.',
    504: 'O tempo limite da solicitação foi excedido. Por favor, tente novamente.'
  },
  [ErrorMessageLanguage.EN]: {
    400: 'The request contains invalid or malformed data.',
    401: 'Authentication is required to access this resource.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    409: 'The operation could not be completed due to a data conflict.',
    422: 'The request is well-formed but contains semantic errors.',
    429: 'Too many requests. Please try again later.',
    500: 'An internal server error occurred. Our team has been notified.',
    502: 'Could not get a response from a required service.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The request timed out. Please try again.'
  }
};

/**
 * Formats an error message for a specific HTTP status code
 * 
 * @param statusCode - The HTTP status code
 * @param defaultMessage - Default message to use if no specific message is found
 * @param context - Error context information
 * @returns A formatted error message for the HTTP status code
 */
export function formatHttpStatusMessage(
  statusCode: number,
  defaultMessage: string,
  context?: ErrorContext
): string {
  // Determine language to use
  const language = context?.language || DEFAULT_ERROR_LANGUAGE;
  
  // Get messages for the selected language
  const messages = HTTP_STATUS_MESSAGES[language] || HTTP_STATUS_MESSAGES[DEFAULT_ERROR_LANGUAGE];
  
  // Get the appropriate message for the status code
  const message = messages[statusCode] || defaultMessage;
  
  return formatUserFriendlyMessage(message, context);
}

/**
 * Formats an error message with additional context for API responses
 * 
 * @param message - The base error message
 * @param errorCode - The error code
 * @param context - Error context information
 * @returns A formatted error message with context for API responses
 */
export function formatApiErrorMessage(
  message: string,
  errorCode: string,
  context?: ErrorContext
): string {
  const formattedCode = formatErrorCode(errorCode, context?.journey);
  const userFriendlyMessage = formatUserFriendlyMessage(message, context);
  
  return `[${formattedCode}] ${userFriendlyMessage}`;
}

/**
 * Creates a journey-specific error message for health journey
 * 
 * @param message - The base error message
 * @param userId - Optional user ID for context
 * @param metadata - Optional additional metadata
 * @returns A formatted error message with health journey context
 */
export function formatHealthError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): string {
  return formatUserFriendlyMessage(message, {
    journey: JourneyType.HEALTH,
    userId,
    metadata
  });
}

/**
 * Creates a journey-specific error message for care journey
 * 
 * @param message - The base error message
 * @param userId - Optional user ID for context
 * @param metadata - Optional additional metadata
 * @returns A formatted error message with care journey context
 */
export function formatCareError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): string {
  return formatUserFriendlyMessage(message, {
    journey: JourneyType.CARE,
    userId,
    metadata
  });
}

/**
 * Creates a journey-specific error message for plan journey
 * 
 * @param message - The base error message
 * @param userId - Optional user ID for context
 * @param metadata - Optional additional metadata
 * @returns A formatted error message with plan journey context
 */
export function formatPlanError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): string {
  return formatUserFriendlyMessage(message, {
    journey: JourneyType.PLAN,
    userId,
    metadata
  });
}

/**
 * Creates a journey-specific error message for gamification
 * 
 * @param message - The base error message
 * @param userId - Optional user ID for context
 * @param metadata - Optional additional metadata
 * @returns A formatted error message with gamification context
 */
export function formatGamificationError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): string {
  return formatUserFriendlyMessage(message, {
    journey: JourneyType.GAMIFICATION,
    userId,
    metadata
  });
}

/**
 * Error message templates by key and language
 */
const ERROR_TEMPLATES = {
  [ErrorMessageLanguage.PT]: {
    'not_found': 'O {{entity}} com {{identifier}} {{value}} não foi encontrado.',
    'already_exists': 'Já existe um {{entity}} com {{identifier}} {{value}}.',
    'invalid_operation': 'Operação inválida: {{reason}}',
    'insufficient_permissions': 'Permissões insuficientes para {{action}}.',
    'validation_failed': 'Falha na validação: {{details}}',
    'service_unavailable': 'O serviço {{service}} está temporariamente indisponível.',
    'rate_limited': 'Limite de requisições excedido. Tente novamente em {{seconds}} segundos.',
    'expired': 'O {{entity}} expirou em {{date}}.',
    'conflict': 'Conflito detectado: {{details}}',
    'database_error': 'Erro de banco de dados: {{message}}'
  },
  [ErrorMessageLanguage.EN]: {
    'not_found': 'The {{entity}} with {{identifier}} {{value}} was not found.',
    'already_exists': 'A {{entity}} with {{identifier}} {{value}} already exists.',
    'invalid_operation': 'Invalid operation: {{reason}}',
    'insufficient_permissions': 'Insufficient permissions to {{action}}.',
    'validation_failed': 'Validation failed: {{details}}',
    'service_unavailable': 'The {{service}} service is temporarily unavailable.',
    'rate_limited': 'Rate limit exceeded. Try again in {{seconds}} seconds.',
    'expired': 'The {{entity}} expired on {{date}}.',
    'conflict': 'Conflict detected: {{details}}',
    'database_error': 'Database error: {{message}}'
  }
};

/**
 * Gets a localized error message template and formats it with variables
 * 
 * @param templateKey - The key of the template to use
 * @param variables - The variables to substitute in the template
 * @param context - Error context information
 * @returns A formatted error message with journey context and substituted variables
 */
export function getLocalizedErrorMessage(
  templateKey: string,
  variables: TemplateVariables,
  context?: ErrorContext
): string {
  // Determine language to use
  const language = context?.language || DEFAULT_ERROR_LANGUAGE;
  
  // Get templates for the selected language
  const templates = ERROR_TEMPLATES[language] || ERROR_TEMPLATES[DEFAULT_ERROR_LANGUAGE];
  
  // Get the template for the specified key
  const template = templates[templateKey];
  
  if (!template) {
    return formatUserFriendlyMessage(String(variables.message || templateKey), context);
  }
  
  // Format the template with variables
  const formattedMessage = formatTemplate(template, variables);
  
  // Add journey context
  return formatUserFriendlyMessage(formattedMessage, context);
}
/**
 * @file error-formatter.ts
 * @description Provides utilities for formatting error messages in a user-friendly, consistent manner
 * across the application. Includes journey-specific error formatting, localization support,
 * and context-aware message enhancement.
 */

import { ErrorType } from '@austa/errors/utils';
import { Journey } from '@austa/interfaces/common';

/**
 * Interface for error formatting options
 */
export interface ErrorFormattingOptions {
  /** The current journey context (Health, Care, Plan) */
  journey?: Journey;
  /** The locale for error message translation */
  locale?: string;
  /** Whether to include technical details in the error message */
  includeTechnicalDetails?: boolean;
  /** Whether to include user action suggestions */
  includeActionSuggestions?: boolean;
  /** Additional context to include in the error message */
  context?: Record<string, any>;
}

/**
 * Interface for a formatted error message
 */
export interface FormattedErrorMessage {
  /** The main error message */
  message: string;
  /** Optional technical details (only included if includeTechnicalDetails is true) */
  technicalDetails?: string;
  /** Optional user action suggestions */
  actionSuggestions?: string[];
  /** The error code */
  errorCode: string;
  /** The journey context */
  journey?: Journey;
  /** Additional context information */
  context?: Record<string, any>;
}

/**
 * Default error formatting options
 */
const DEFAULT_OPTIONS: ErrorFormattingOptions = {
  locale: 'pt-BR',
  includeTechnicalDetails: process.env.NODE_ENV !== 'production',
  includeActionSuggestions: true,
};

/**
 * Maps error types to user-friendly message prefixes
 */
const ERROR_TYPE_PREFIXES: Record<ErrorType, Record<string, string>> = {
  [ErrorType.VALIDATION]: {
    'en-US': 'Validation Error',
    'pt-BR': 'Erro de Validação',
  },
  [ErrorType.BUSINESS]: {
    'en-US': 'Business Rule Error',
    'pt-BR': 'Erro de Regra de Negócio',
  },
  [ErrorType.TECHNICAL]: {
    'en-US': 'Technical Error',
    'pt-BR': 'Erro Técnico',
  },
  [ErrorType.EXTERNAL]: {
    'en-US': 'External System Error',
    'pt-BR': 'Erro de Sistema Externo',
  },
};

/**
 * Maps journey types to user-friendly journey names
 */
const JOURNEY_NAMES: Record<Journey, Record<string, string>> = {
  [Journey.HEALTH]: {
    'en-US': 'Health Journey',
    'pt-BR': 'Jornada de Saúde',
  },
  [Journey.CARE]: {
    'en-US': 'Care Journey',
    'pt-BR': 'Jornada de Cuidados',
  },
  [Journey.PLAN]: {
    'en-US': 'Plan Journey',
    'pt-BR': 'Jornada de Plano',
  },
};

/**
 * Maps error types to user action suggestions
 */
const ACTION_SUGGESTIONS: Record<ErrorType, Record<string, string[]>> = {
  [ErrorType.VALIDATION]: {
    'en-US': [
      'Please check the provided information and try again.',
      'Ensure all required fields are filled correctly.',
      'Verify the format of the entered data.',
    ],
    'pt-BR': [
      'Por favor, verifique as informações fornecidas e tente novamente.',
      'Certifique-se de que todos os campos obrigatórios estão preenchidos corretamente.',
      'Verifique o formato dos dados inseridos.',
    ],
  },
  [ErrorType.BUSINESS]: {
    'en-US': [
      'This operation cannot be completed due to business rules.',
      'You may need to meet certain conditions before proceeding.',
      'Contact support if you believe this is an error.',
    ],
    'pt-BR': [
      'Esta operação não pode ser concluída devido às regras de negócio.',
      'Pode ser necessário atender a certas condições antes de prosseguir.',
      'Entre em contato com o suporte se acreditar que isso é um erro.',
    ],
  },
  [ErrorType.TECHNICAL]: {
    'en-US': [
      'A technical issue has occurred. Please try again later.',
      'If the problem persists, contact our support team.',
      'Our technical team has been notified of this issue.',
    ],
    'pt-BR': [
      'Ocorreu um problema técnico. Por favor, tente novamente mais tarde.',
      'Se o problema persistir, entre em contato com nossa equipe de suporte.',
      'Nossa equipe técnica foi notificada sobre este problema.',
    ],
  },
  [ErrorType.EXTERNAL]: {
    'en-US': [
      'An external system is currently unavailable. Please try again later.',
      'This issue is likely temporary and should resolve shortly.',
      'You can continue using other features while we resolve this issue.',
    ],
    'pt-BR': [
      'Um sistema externo está indisponível no momento. Por favor, tente novamente mais tarde.',
      'Este problema provavelmente é temporário e deve ser resolvido em breve.',
      'Você pode continuar usando outros recursos enquanto resolvemos este problema.',
    ],
  },
};

/**
 * Journey-specific error message enhancers
 */
const JOURNEY_ENHANCERS: Record<Journey, (message: string, locale: string) => string> = {
  [Journey.HEALTH]: (message: string, locale: string) => {
    const prefix = locale === 'en-US' ? 'Health Journey: ' : 'Jornada de Saúde: ';
    return `${prefix}${message}`;
  },
  [Journey.CARE]: (message: string, locale: string) => {
    const prefix = locale === 'en-US' ? 'Care Journey: ' : 'Jornada de Cuidados: ';
    return `${prefix}${message}`;
  },
  [Journey.PLAN]: (message: string, locale: string) => {
    const prefix = locale === 'en-US' ? 'Plan Journey: ' : 'Jornada de Plano: ';
    return `${prefix}${message}`;
  },
};

/**
 * Error code to message mapping
 */
export interface ErrorCodeMapping {
  code: string;
  messages: Record<string, string>;
  type: ErrorType;
}

/**
 * Common error code mappings
 */
const ERROR_CODE_MAPPINGS: Record<string, ErrorCodeMapping> = {
  'VALIDATION_REQUIRED_FIELD': {
    code: 'VALIDATION_REQUIRED_FIELD',
    messages: {
      'en-US': 'Required field is missing',
      'pt-BR': 'Campo obrigatório não preenchido',
    },
    type: ErrorType.VALIDATION,
  },
  'VALIDATION_INVALID_FORMAT': {
    code: 'VALIDATION_INVALID_FORMAT',
    messages: {
      'en-US': 'Invalid format',
      'pt-BR': 'Formato inválido',
    },
    type: ErrorType.VALIDATION,
  },
  'BUSINESS_RESOURCE_NOT_FOUND': {
    code: 'BUSINESS_RESOURCE_NOT_FOUND',
    messages: {
      'en-US': 'Resource not found',
      'pt-BR': 'Recurso não encontrado',
    },
    type: ErrorType.BUSINESS,
  },
  'BUSINESS_DUPLICATE_RESOURCE': {
    code: 'BUSINESS_DUPLICATE_RESOURCE',
    messages: {
      'en-US': 'Resource already exists',
      'pt-BR': 'Recurso já existe',
    },
    type: ErrorType.BUSINESS,
  },
  'TECHNICAL_DATABASE_ERROR': {
    code: 'TECHNICAL_DATABASE_ERROR',
    messages: {
      'en-US': 'Database operation failed',
      'pt-BR': 'Operação de banco de dados falhou',
    },
    type: ErrorType.TECHNICAL,
  },
  'TECHNICAL_INTERNAL_ERROR': {
    code: 'TECHNICAL_INTERNAL_ERROR',
    messages: {
      'en-US': 'Internal server error',
      'pt-BR': 'Erro interno do servidor',
    },
    type: ErrorType.TECHNICAL,
  },
  'EXTERNAL_API_UNAVAILABLE': {
    code: 'EXTERNAL_API_UNAVAILABLE',
    messages: {
      'en-US': 'External API is unavailable',
      'pt-BR': 'API externa está indisponível',
    },
    type: ErrorType.EXTERNAL,
  },
  'EXTERNAL_TIMEOUT': {
    code: 'EXTERNAL_TIMEOUT',
    messages: {
      'en-US': 'External system timeout',
      'pt-BR': 'Tempo limite do sistema externo',
    },
    type: ErrorType.EXTERNAL,
  },
};

/**
 * Journey-specific error code mappings
 */
const JOURNEY_ERROR_CODE_MAPPINGS: Record<Journey, Record<string, ErrorCodeMapping>> = {
  [Journey.HEALTH]: {
    'HEALTH_DEVICE_CONNECTION_FAILED': {
      code: 'HEALTH_DEVICE_CONNECTION_FAILED',
      messages: {
        'en-US': 'Failed to connect to health device',
        'pt-BR': 'Falha ao conectar ao dispositivo de saúde',
      },
      type: ErrorType.EXTERNAL,
    },
    'HEALTH_METRIC_INVALID': {
      code: 'HEALTH_METRIC_INVALID',
      messages: {
        'en-US': 'Invalid health metric value',
        'pt-BR': 'Valor de métrica de saúde inválido',
      },
      type: ErrorType.VALIDATION,
    },
    'HEALTH_GOAL_NOT_FOUND': {
      code: 'HEALTH_GOAL_NOT_FOUND',
      messages: {
        'en-US': 'Health goal not found',
        'pt-BR': 'Meta de saúde não encontrada',
      },
      type: ErrorType.BUSINESS,
    },
  },
  [Journey.CARE]: {
    'CARE_APPOINTMENT_NOT_AVAILABLE': {
      code: 'CARE_APPOINTMENT_NOT_AVAILABLE',
      messages: {
        'en-US': 'Appointment slot is not available',
        'pt-BR': 'Horário de consulta não está disponível',
      },
      type: ErrorType.BUSINESS,
    },
    'CARE_PROVIDER_NOT_FOUND': {
      code: 'CARE_PROVIDER_NOT_FOUND',
      messages: {
        'en-US': 'Healthcare provider not found',
        'pt-BR': 'Prestador de cuidados de saúde não encontrado',
      },
      type: ErrorType.BUSINESS,
    },
    'CARE_TELEMEDICINE_CONNECTION_FAILED': {
      code: 'CARE_TELEMEDICINE_CONNECTION_FAILED',
      messages: {
        'en-US': 'Failed to establish telemedicine connection',
        'pt-BR': 'Falha ao estabelecer conexão de telemedicina',
      },
      type: ErrorType.EXTERNAL,
    },
  },
  [Journey.PLAN]: {
    'PLAN_NOT_FOUND': {
      code: 'PLAN_NOT_FOUND',
      messages: {
        'en-US': 'Insurance plan not found',
        'pt-BR': 'Plano de seguro não encontrado',
      },
      type: ErrorType.BUSINESS,
    },
    'PLAN_CLAIM_INVALID': {
      code: 'PLAN_CLAIM_INVALID',
      messages: {
        'en-US': 'Invalid insurance claim',
        'pt-BR': 'Solicitação de seguro inválida',
      },
      type: ErrorType.VALIDATION,
    },
    'PLAN_BENEFIT_NOT_COVERED': {
      code: 'PLAN_BENEFIT_NOT_COVERED',
      messages: {
        'en-US': 'Benefit not covered by your plan',
        'pt-BR': 'Benefício não coberto pelo seu plano',
      },
      type: ErrorType.BUSINESS,
    },
  },
};

/**
 * ErrorFormatter class provides methods for formatting error messages in a user-friendly,
 * consistent manner across the application.
 */
export class ErrorFormatter {
  /**
   * Formats an error message with the given options
   * 
   * @param errorCode - The error code
   * @param message - The error message (optional, will use mapped message if not provided)
   * @param errorType - The error type (optional, will be derived from error code if not provided)
   * @param options - Formatting options
   * @returns A formatted error message
   */
  public static formatError(
    errorCode: string,
    message?: string,
    errorType?: ErrorType,
    options: ErrorFormattingOptions = {}
  ): FormattedErrorMessage {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { journey, locale = 'pt-BR', includeTechnicalDetails, includeActionSuggestions, context } = mergedOptions;
    
    // Get error mapping and type
    const errorMapping = this.getErrorCodeMapping(errorCode, journey);
    const type = errorType || (errorMapping ? errorMapping.type : ErrorType.TECHNICAL);
    
    // Get the base message
    let formattedMessage = message || (errorMapping ? errorMapping.messages[locale] || errorMapping.messages['pt-BR'] : errorCode);
    
    // Add error type prefix
    const typePrefix = ERROR_TYPE_PREFIXES[type][locale] || ERROR_TYPE_PREFIXES[type]['pt-BR'];
    formattedMessage = `${typePrefix}: ${formattedMessage}`;
    
    // Enhance with journey context if available
    if (journey && JOURNEY_ENHANCERS[journey]) {
      formattedMessage = JOURNEY_ENHANCERS[journey](formattedMessage, locale);
    }
    
    // Build the formatted error response
    const formattedError: FormattedErrorMessage = {
      message: formattedMessage,
      errorCode,
      journey,
    };
    
    // Add technical details if requested
    if (includeTechnicalDetails) {
      formattedError.technicalDetails = `Error Code: ${errorCode}, Type: ${type}`;
    }
    
    // Add action suggestions if requested
    if (includeActionSuggestions) {
      const suggestions = ACTION_SUGGESTIONS[type][locale] || ACTION_SUGGESTIONS[type]['pt-BR'];
      formattedError.actionSuggestions = suggestions;
    }
    
    // Add context if provided
    if (context) {
      formattedError.context = context;
    }
    
    return formattedError;
  }
  
  /**
   * Gets the error code mapping for a given error code and journey
   * 
   * @param errorCode - The error code
   * @param journey - The journey context (optional)
   * @returns The error code mapping or undefined if not found
   */
  private static getErrorCodeMapping(errorCode: string, journey?: Journey): ErrorCodeMapping | undefined {
    // Check journey-specific mappings first if journey is provided
    if (journey && JOURNEY_ERROR_CODE_MAPPINGS[journey] && JOURNEY_ERROR_CODE_MAPPINGS[journey][errorCode]) {
      return JOURNEY_ERROR_CODE_MAPPINGS[journey][errorCode];
    }
    
    // Fall back to common mappings
    return ERROR_CODE_MAPPINGS[errorCode];
  }
  
  /**
   * Formats an error message specifically for a journey context
   * 
   * @param journey - The journey context
   * @param errorCode - The error code
   * @param message - The error message (optional)
   * @param errorType - The error type (optional)
   * @param options - Additional formatting options
   * @returns A formatted error message with journey context
   */
  public static formatJourneyError(
    journey: Journey,
    errorCode: string,
    message?: string,
    errorType?: ErrorType,
    options: Omit<ErrorFormattingOptions, 'journey'> = {}
  ): FormattedErrorMessage {
    return this.formatError(errorCode, message, errorType, { ...options, journey });
  }
  
  /**
   * Enhances an error message with additional context
   * 
   * @param formattedError - The formatted error message to enhance
   * @param context - The context to add
   * @returns The enhanced error message
   */
  public static enhanceWithContext(
    formattedError: FormattedErrorMessage,
    context: Record<string, any>
  ): FormattedErrorMessage {
    return {
      ...formattedError,
      context: { ...(formattedError.context || {}), ...context },
    };
  }
  
  /**
   * Translates an error message to the specified locale
   * 
   * @param formattedError - The formatted error message to translate
   * @param targetLocale - The target locale
   * @returns The translated error message
   */
  public static translateError(
    formattedError: FormattedErrorMessage,
    targetLocale: string
  ): FormattedErrorMessage {
    const { errorCode, journey } = formattedError;
    
    // Get the error mapping
    const errorMapping = this.getErrorCodeMapping(errorCode, journey);
    if (!errorMapping) {
      return formattedError; // Can't translate without mapping
    }
    
    // Get the translated message
    const translatedMessage = errorMapping.messages[targetLocale] || errorMapping.messages['pt-BR'];
    if (!translatedMessage) {
      return formattedError; // No translation available
    }
    
    // Format the translated error
    return this.formatError(errorCode, translatedMessage, errorMapping.type, {
      locale: targetLocale,
      journey,
      includeTechnicalDetails: !!formattedError.technicalDetails,
      includeActionSuggestions: !!formattedError.actionSuggestions,
      context: formattedError.context,
    });
  }
  
  /**
   * Registers a custom error code mapping
   * 
   * @param mapping - The error code mapping to register
   * @param journey - The journey to register the mapping for (optional)
   */
  public static registerErrorCodeMapping(mapping: ErrorCodeMapping, journey?: Journey): void {
    if (journey) {
      if (!JOURNEY_ERROR_CODE_MAPPINGS[journey]) {
        JOURNEY_ERROR_CODE_MAPPINGS[journey] = {};
      }
      JOURNEY_ERROR_CODE_MAPPINGS[journey][mapping.code] = mapping;
    } else {
      ERROR_CODE_MAPPINGS[mapping.code] = mapping;
    }
  }
  
  /**
   * Gets user action suggestions for an error type
   * 
   * @param errorType - The error type
   * @param locale - The locale (defaults to pt-BR)
   * @returns An array of action suggestions
   */
  public static getActionSuggestions(errorType: ErrorType, locale: string = 'pt-BR'): string[] {
    return ACTION_SUGGESTIONS[errorType][locale] || ACTION_SUGGESTIONS[errorType]['pt-BR'];
  }
}

/**
 * Utility function to create a template-based error message with variable substitution
 * 
 * @param template - The message template with placeholders (e.g., "User {userId} not found")
 * @param variables - The variables to substitute in the template
 * @returns The formatted message with variables substituted
 */
export function formatTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/{([^{}]*)}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Utility function to create a journey-specific error message
 * 
 * @param journey - The journey context
 * @param message - The error message
 * @param locale - The locale (defaults to pt-BR)
 * @returns A journey-enhanced error message
 */
export function formatJourneyMessage(journey: Journey, message: string, locale: string = 'pt-BR'): string {
  if (JOURNEY_ENHANCERS[journey]) {
    return JOURNEY_ENHANCERS[journey](message, locale);
  }
  return message;
}

/**
 * Utility function to get a localized error message for an error code
 * 
 * @param errorCode - The error code
 * @param locale - The locale (defaults to pt-BR)
 * @param journey - The journey context (optional)
 * @returns The localized error message or the error code if no mapping is found
 */
export function getLocalizedErrorMessage(errorCode: string, locale: string = 'pt-BR', journey?: Journey): string {
  const mapping = ErrorFormatter.getErrorCodeMapping(errorCode, journey);
  if (mapping) {
    return mapping.messages[locale] || mapping.messages['pt-BR'] || errorCode;
  }
  return errorCode;
}

// Re-export the ErrorFormatter class as the default export
export default ErrorFormatter;
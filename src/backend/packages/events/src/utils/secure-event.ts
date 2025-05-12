import { BaseEventDto } from '../dto/base-event.dto';
import { EventTypes } from '../dto/event-types.enum';
import { ValidationResult } from '../interfaces/event-validation.interface';

/**
 * Sensitive data patterns that should be sanitized from event payloads
 * These are regex patterns that match common sensitive data formats
 */
const SENSITIVE_DATA_PATTERNS = {
  // Personal identifiable information
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  CPF: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // Financial information
  CREDIT_CARD: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
  BANK_ACCOUNT: /\b\d{4,17}\b/g,
  // Authentication data
  PASSWORD: /"password"\s*:\s*"[^"]*"/g,
  ACCESS_TOKEN: /"(access_token|accessToken|token)"\s*:\s*"[^"]*"/g,
  REFRESH_TOKEN: /"(refresh_token|refreshToken)"\s*:\s*"[^"]*"/g,
  // Healthcare specific
  MEDICAL_RECORD_NUMBER: /\bMRN\s*:?\s*\d{6,10}\b/gi,
};

/**
 * List of event types that require special handling for sensitive data
 */
const SENSITIVE_EVENT_TYPES = [
  // Health journey events with sensitive medical data
  EventTypes.Health.HEALTH_METRIC_RECORDED,
  EventTypes.Health.MEDICAL_RECORD_UPDATED,
  EventTypes.Health.HEALTH_GOAL_ACHIEVED,
  // Care journey events with provider/patient information
  EventTypes.Care.APPOINTMENT_BOOKED,
  EventTypes.Care.MEDICATION_TAKEN,
  EventTypes.Care.TELEMEDICINE_SESSION_COMPLETED,
  // Plan journey events with financial information
  EventTypes.Plan.CLAIM_SUBMITTED,
  EventTypes.Plan.BENEFIT_UTILIZED,
  EventTypes.Plan.PAYMENT_PROCESSED,
];

/**
 * Journey-specific security policies for event content
 */
const JOURNEY_SECURITY_POLICIES = {
  health: {
    allowedSources: ['health-service', 'device-integration', 'fhir-connector'],
    sensitiveFields: ['medicalHistory', 'diagnosis', 'vitalSigns', 'labResults', 'medications'],
    requiredFields: ['userId', 'timestamp', 'type'],
  },
  care: {
    allowedSources: ['care-service', 'appointment-system', 'telemedicine-platform'],
    sensitiveFields: ['providerNotes', 'symptoms', 'treatmentPlan', 'prescriptions'],
    requiredFields: ['userId', 'timestamp', 'type'],
  },
  plan: {
    allowedSources: ['plan-service', 'claims-processor', 'payment-gateway'],
    sensitiveFields: ['claimAmount', 'paymentDetails', 'bankInformation', 'coverageDetails'],
    requiredFields: ['userId', 'timestamp', 'type'],
  },
  // Default policy for events without a specific journey
  default: {
    allowedSources: ['api-gateway', 'auth-service', 'notification-service', 'gamification-engine'],
    sensitiveFields: [],
    requiredFields: ['userId', 'timestamp', 'type'],
  },
};

/**
 * Blocked IP ranges for event source validation
 * Similar to SSRF protection in secure-axios
 */
const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^0\.0\.0\.0/,
  /^localhost$/,
  /^::1$/,
  /^fe80::/,
  /\.local$/,
];

/**
 * Interface for sanitization options
 */
interface SanitizeOptions {
  /** Whether to remove all sensitive data patterns */
  removeSensitiveData?: boolean;
  /** Whether to apply journey-specific sanitization rules */
  applyJourneyRules?: boolean;
  /** Custom fields to sanitize beyond the defaults */
  additionalSensitiveFields?: string[];
  /** Custom replacement for sanitized values */
  replacement?: string;
}

/**
 * Interface for source validation options
 */
interface SourceValidationOptions {
  /** Whether to validate against allowed sources list */
  checkAllowedSources?: boolean;
  /** Whether to validate IP addresses in source */
  checkIpAddresses?: boolean;
  /** Additional allowed sources beyond the defaults */
  additionalAllowedSources?: string[];
}

/**
 * Creates a secured event by sanitizing sensitive data and validating the source
 * 
 * @param event The event to secure
 * @param sanitizeOptions Options for sanitizing the event
 * @param sourceValidationOptions Options for validating the event source
 * @returns The secured event with sanitized data
 */
export function createSecureEvent<T extends BaseEventDto>(
  event: T,
  sanitizeOptions: SanitizeOptions = {},
  sourceValidationOptions: SourceValidationOptions = {}
): T {
  // Validate the event source
  validateEventSource(event, sourceValidationOptions);
  
  // Sanitize the event payload
  return sanitizeEventPayload(event, sanitizeOptions);
}

/**
 * Sanitizes an event payload by removing or masking sensitive data
 * 
 * @param event The event to sanitize
 * @param options Options for sanitization
 * @returns The sanitized event
 */
export function sanitizeEventPayload<T extends BaseEventDto>(
  event: T,
  options: SanitizeOptions = {}
): T {
  const {
    removeSensitiveData = true,
    applyJourneyRules = true,
    additionalSensitiveFields = [],
    replacement = '[REDACTED]',
  } = options;
  
  // Create a deep copy of the event to avoid modifying the original
  const sanitizedEvent = JSON.parse(JSON.stringify(event)) as T;
  
  if (!sanitizedEvent.data) {
    return sanitizedEvent;
  }
  
  // Apply journey-specific rules if enabled
  if (applyJourneyRules && sanitizedEvent.journey) {
    const journeyPolicy = JOURNEY_SECURITY_POLICIES[sanitizedEvent.journey as keyof typeof JOURNEY_SECURITY_POLICIES] || 
                          JOURNEY_SECURITY_POLICIES.default;
    
    // Sanitize journey-specific sensitive fields
    const fieldsToSanitize = [...journeyPolicy.sensitiveFields, ...additionalSensitiveFields];
    
    for (const field of fieldsToSanitize) {
      sanitizeNestedField(sanitizedEvent.data, field, replacement);
    }
  }
  
  // Remove common sensitive data patterns if enabled
  if (removeSensitiveData) {
    // Check if this event type requires special handling
    const requiresSpecialHandling = SENSITIVE_EVENT_TYPES.includes(sanitizedEvent.type as EventTypes);
    
    // Convert the data to a string for regex replacement
    let dataString = JSON.stringify(sanitizedEvent.data);
    
    // Apply regex patterns to remove sensitive data
    for (const [patternName, pattern] of Object.entries(SENSITIVE_DATA_PATTERNS)) {
      dataString = dataString.replace(pattern, replacement);
    }
    
    // Parse the string back to an object
    try {
      sanitizedEvent.data = JSON.parse(dataString);
    } catch (error) {
      // If parsing fails, keep the original data
      console.error('Failed to parse sanitized data:', error);
    }
  }
  
  return sanitizedEvent;
}

/**
 * Validates that an event comes from an authorized source
 * 
 * @param event The event to validate
 * @param options Options for source validation
 * @throws Error if the event source is not valid
 */
export function validateEventSource<T extends BaseEventDto>(
  event: T,
  options: SourceValidationOptions = {}
): void {
  const {
    checkAllowedSources = true,
    checkIpAddresses = true,
    additionalAllowedSources = [],
  } = options;
  
  if (!event.source) {
    throw new Error('Event source is required for security validation');
  }
  
  // Check against allowed sources if enabled
  if (checkAllowedSources) {
    const journeyPolicy = event.journey ? 
      (JOURNEY_SECURITY_POLICIES[event.journey as keyof typeof JOURNEY_SECURITY_POLICIES] || JOURNEY_SECURITY_POLICIES.default) :
      JOURNEY_SECURITY_POLICIES.default;
    
    const allowedSources = [...journeyPolicy.allowedSources, ...additionalAllowedSources];
    
    if (!allowedSources.includes(event.source)) {
      throw new Error(`Event source '${event.source}' is not in the allowed sources list for journey '${event.journey || 'default'}'`);
    }
  }
  
  // Check for blocked IP addresses if enabled
  if (checkIpAddresses) {
    // Extract potential IP addresses from the source string
    const ipMatches = event.source.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    
    if (ipMatches) {
      const ip = ipMatches[0];
      
      // Check against blocked IP ranges
      for (const blockedRange of BLOCKED_IP_RANGES) {
        if (blockedRange.test(ip)) {
          throw new Error(`Event source contains blocked IP address: ${ip}`);
        }
      }
    }
  }
}

/**
 * Validates an event against journey-specific security policies
 * 
 * @param event The event to validate
 * @returns Validation result with success flag and any error messages
 */
export function validateEventSecurity<T extends BaseEventDto>(event: T): ValidationResult {
  const errors: string[] = [];
  
  // Check for required fields based on journey
  const journeyPolicy = event.journey ? 
    (JOURNEY_SECURITY_POLICIES[event.journey as keyof typeof JOURNEY_SECURITY_POLICIES] || JOURNEY_SECURITY_POLICIES.default) :
    JOURNEY_SECURITY_POLICIES.default;
  
  for (const field of journeyPolicy.requiredFields) {
    if (!(field in event) || event[field as keyof T] === undefined || event[field as keyof T] === null) {
      errors.push(`Required field '${field}' is missing or null`);
    }
  }
  
  // Validate event source
  try {
    validateEventSource(event);
  } catch (error) {
    errors.push((error as Error).message);
  }
  
  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a nested field in an object by replacing its value with a placeholder
 * 
 * @param obj The object containing the field to sanitize
 * @param field The field path (can be nested with dot notation, e.g., 'user.address.street')
 * @param replacement The replacement value
 */
function sanitizeNestedField(obj: any, field: string, replacement: string): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  const parts = field.split('.');
  const currentPart = parts[0];
  
  if (parts.length === 1) {
    // Base case: replace the field if it exists
    if (currentPart in obj) {
      obj[currentPart] = replacement;
    }
  } else {
    // Recursive case: traverse the object
    const remainingParts = parts.slice(1).join('.');
    
    if (currentPart in obj && obj[currentPart] !== null && typeof obj[currentPart] === 'object') {
      sanitizeNestedField(obj[currentPart], remainingParts, replacement);
    }
  }
  
  // Also check arrays at this level
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      for (let i = 0; i < obj[key].length; i++) {
        if (typeof obj[key][i] === 'object' && obj[key][i] !== null) {
          sanitizeNestedField(obj[key][i], field, replacement);
        }
      }
    }
  }
}

/**
 * Checks if an event contains sensitive data that should be sanitized
 * 
 * @param event The event to check
 * @returns True if the event contains sensitive data, false otherwise
 */
export function containsSensitiveData<T extends BaseEventDto>(event: T): boolean {
  if (!event.data) {
    return false;
  }
  
  const dataString = JSON.stringify(event.data);
  
  // Check against sensitive data patterns
  for (const pattern of Object.values(SENSITIVE_DATA_PATTERNS)) {
    if (pattern.test(dataString)) {
      return true;
    }
  }
  
  // Check against journey-specific sensitive fields
  if (event.journey) {
    const journeyPolicy = JOURNEY_SECURITY_POLICIES[event.journey as keyof typeof JOURNEY_SECURITY_POLICIES] || 
                          JOURNEY_SECURITY_POLICIES.default;
    
    for (const field of journeyPolicy.sensitiveFields) {
      const parts = field.split('.');
      let current: any = event.data;
      
      // Navigate the object path
      let fieldExists = true;
      for (const part of parts) {
        if (current === null || typeof current !== 'object' || !(part in current)) {
          fieldExists = false;
          break;
        }
        current = current[part];
      }
      
      if (fieldExists && current !== undefined && current !== null) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Creates a secure event producer that automatically sanitizes events before sending
 * 
 * @param producerFn The original event producer function
 * @param sanitizeOptions Options for sanitizing events
 * @returns A wrapped producer function that sanitizes events
 */
export function createSecureEventProducer<T extends BaseEventDto>(
  producerFn: (event: T) => Promise<any>,
  sanitizeOptions: SanitizeOptions = {}
): (event: T) => Promise<any> {
  return async (event: T) => {
    // Sanitize the event before producing
    const sanitizedEvent = sanitizeEventPayload(event, sanitizeOptions);
    
    // Validate the event security
    const validationResult = validateEventSecurity(sanitizedEvent);
    if (!validationResult.success) {
      throw new Error(`Event security validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Call the original producer with the sanitized event
    return producerFn(sanitizedEvent);
  };
}

/**
 * Creates a secure event consumer that validates events before processing
 * 
 * @param consumerFn The original event consumer function
 * @param sourceValidationOptions Options for validating event sources
 * @returns A wrapped consumer function that validates events
 */
export function createSecureEventConsumer<T extends BaseEventDto, R>(
  consumerFn: (event: T) => Promise<R>,
  sourceValidationOptions: SourceValidationOptions = {}
): (event: T) => Promise<R> {
  return async (event: T) => {
    // Validate the event source
    validateEventSource(event, sourceValidationOptions);
    
    // Validate the event security
    const validationResult = validateEventSecurity(event);
    if (!validationResult.success) {
      throw new Error(`Event security validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Call the original consumer with the validated event
    return consumerFn(event);
  };
}
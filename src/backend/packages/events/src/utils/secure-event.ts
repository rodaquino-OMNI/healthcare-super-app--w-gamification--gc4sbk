/**
 * Provides security utilities for event payloads, ensuring that sensitive data is properly
 * handled and protected. Adapted from secure-axios pattern, this module includes functions
 * to sanitize event payloads, validate event sources, and protect against malicious event
 * injection. It implements journey-specific payload validation rules and security policies
 * to prevent data leakage or injection attacks through the event system.
 */

import { JourneyType } from '../dto/event-types.enum';

/**
 * Represents a security policy for event payloads
 */
export interface EventSecurityPolicy {
  /**
   * List of fields that should be completely removed from the event payload
   */
  sensitiveFields: string[];

  /**
   * List of fields that should be masked (e.g., partially hidden) in the event payload
   */
  maskedFields: Record<string, MaskingStrategy>;

  /**
   * List of allowed sources that can produce this event
   */
  allowedSources: string[];

  /**
   * Maximum allowed size of the event payload in bytes
   */
  maxPayloadSize: number;

  /**
   * Whether to validate the JWT token in the event metadata
   */
  validateJwt: boolean;
}

/**
 * Strategy for masking sensitive data
 */
export enum MaskingStrategy {
  /**
   * Replace the entire value with asterisks
   */
  FULL = 'FULL',

  /**
   * Keep the first and last characters, replace the rest with asterisks
   */
  PARTIAL = 'PARTIAL',

  /**
   * Replace with a fixed value (e.g., '[REDACTED]')
   */
  FIXED = 'FIXED',

  /**
   * Custom masking strategy defined by a function
   */
  CUSTOM = 'CUSTOM'
}

/**
 * Options for sanitizing event payloads
 */
export interface SanitizeOptions {
  /**
   * Whether to throw an error if sensitive data is found
   * @default false
   */
  throwOnSensitiveData?: boolean;

  /**
   * Custom masking function for CUSTOM masking strategy
   */
  customMaskingFn?: (value: any, field: string) => any;

  /**
   * Whether to log sanitization actions
   * @default false
   */
  logSanitization?: boolean;

  /**
   * Fixed value to use for FIXED masking strategy
   * @default '[REDACTED]'
   */
  fixedMaskValue?: string;
}

/**
 * Result of event source validation
 */
export interface SourceValidationResult {
  /**
   * Whether the source is valid
   */
  valid: boolean;

  /**
   * Error message if validation failed
   */
  error?: string;
}

/**
 * Default security policies for each journey
 */
const defaultSecurityPolicies: Record<JourneyType, EventSecurityPolicy> = {
  [JourneyType.HEALTH]: {
    sensitiveFields: [
      'password',
      'ssn',
      'creditCard',
      'medicalRecordNumber',
      'deviceCredentials'
    ],
    maskedFields: {
      'phoneNumber': MaskingStrategy.PARTIAL,
      'email': MaskingStrategy.PARTIAL,
      'address': MaskingStrategy.FIXED
    },
    allowedSources: [
      'health-service',
      'mobile-app',
      'web-app',
      'wearable-integration'
    ],
    maxPayloadSize: 100 * 1024, // 100KB
    validateJwt: true
  },
  [JourneyType.CARE]: {
    sensitiveFields: [
      'password',
      'ssn',
      'creditCard',
      'diagnosisNotes',
      'treatmentPlan',
      'medicationDetails'
    ],
    maskedFields: {
      'phoneNumber': MaskingStrategy.PARTIAL,
      'email': MaskingStrategy.PARTIAL,
      'address': MaskingStrategy.FIXED,
      'symptoms': MaskingStrategy.FIXED
    },
    allowedSources: [
      'care-service',
      'mobile-app',
      'web-app',
      'telemedicine-provider'
    ],
    maxPayloadSize: 150 * 1024, // 150KB
    validateJwt: true
  },
  [JourneyType.PLAN]: {
    sensitiveFields: [
      'password',
      'ssn',
      'creditCard',
      'bankAccount',
      'taxId',
      'policyNumber'
    ],
    maskedFields: {
      'phoneNumber': MaskingStrategy.PARTIAL,
      'email': MaskingStrategy.PARTIAL,
      'address': MaskingStrategy.FIXED,
      'claimAmount': MaskingStrategy.FIXED
    },
    allowedSources: [
      'plan-service',
      'mobile-app',
      'web-app',
      'payment-processor'
    ],
    maxPayloadSize: 200 * 1024, // 200KB
    validateJwt: true
  }
};

/**
 * Sanitizes an event payload by removing or masking sensitive data
 * 
 * @param payload The event payload to sanitize
 * @param journey The journey type for journey-specific sanitization rules
 * @param options Options for sanitization behavior
 * @returns The sanitized payload
 */
export function sanitizeEventPayload<T extends Record<string, any>>(
  payload: T,
  journey: JourneyType,
  options: SanitizeOptions = {}
): T {
  const {
    throwOnSensitiveData = false,
    customMaskingFn,
    logSanitization = false,
    fixedMaskValue = '[REDACTED]'
  } = options;

  // Get the security policy for this journey
  const policy = defaultSecurityPolicies[journey];
  if (!policy) {
    throw new Error(`No security policy found for journey: ${journey}`);
  }

  // Create a deep copy of the payload to avoid modifying the original
  const sanitizedPayload = JSON.parse(JSON.stringify(payload)) as T;

  // Helper function to recursively sanitize an object
  const sanitizeObject = (obj: Record<string, any>, path = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if this field should be completely removed
      if (policy.sensitiveFields.includes(key) || policy.sensitiveFields.includes(currentPath)) {
        if (throwOnSensitiveData) {
          throw new Error(`Sensitive data found in event payload: ${currentPath}`);
        }

        if (logSanitization) {
          console.warn(`Removing sensitive field from event payload: ${currentPath}`);
        }

        delete obj[key];
        continue;
      }

      // Check if this field should be masked
      const maskingStrategy = policy.maskedFields[key] || policy.maskedFields[currentPath];
      if (maskingStrategy && typeof value === 'string') {
        if (logSanitization) {
          console.warn(`Masking sensitive field in event payload: ${currentPath}`);
        }

        switch (maskingStrategy) {
          case MaskingStrategy.FULL:
            obj[key] = '*'.repeat(value.length);
            break;
          case MaskingStrategy.PARTIAL:
            if (value.length <= 2) {
              obj[key] = '*'.repeat(value.length);
            } else {
              obj[key] = value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
            }
            break;
          case MaskingStrategy.FIXED:
            obj[key] = fixedMaskValue;
            break;
          case MaskingStrategy.CUSTOM:
            if (customMaskingFn) {
              obj[key] = customMaskingFn(value, currentPath);
            } else {
              obj[key] = fixedMaskValue;
            }
            break;
        }
        continue;
      }

      // Recursively sanitize nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitizeObject(value, currentPath);
      } else if (Array.isArray(value)) {
        // Sanitize arrays of objects
        for (let i = 0; i < value.length; i++) {
          if (value[i] && typeof value[i] === 'object') {
            sanitizeObject(value[i], `${currentPath}[${i}]`);
          }
        }
      }
    }
  };

  // Start sanitizing from the root
  sanitizeObject(sanitizedPayload);

  return sanitizedPayload;
}

/**
 * Validates that an event comes from an authorized source
 * 
 * @param source The source of the event
 * @param journey The journey type for journey-specific validation rules
 * @returns Validation result with valid flag and optional error message
 */
export function validateEventSource(
  source: string,
  journey: JourneyType
): SourceValidationResult {
  const policy = defaultSecurityPolicies[journey];
  if (!policy) {
    return {
      valid: false,
      error: `No security policy found for journey: ${journey}`
    };
  }

  if (!source) {
    return {
      valid: false,
      error: 'Event source is required'
    };
  }

  if (!policy.allowedSources.includes(source)) {
    return {
      valid: false,
      error: `Unauthorized event source: ${source}. Allowed sources: ${policy.allowedSources.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validates that an event payload does not exceed the maximum allowed size
 * 
 * @param payload The event payload to validate
 * @param journey The journey type for journey-specific validation rules
 * @returns Validation result with valid flag and optional error message
 */
export function validatePayloadSize<T>(
  payload: T,
  journey: JourneyType
): SourceValidationResult {
  const policy = defaultSecurityPolicies[journey];
  if (!policy) {
    return {
      valid: false,
      error: `No security policy found for journey: ${journey}`
    };
  }

  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (payloadSize > policy.maxPayloadSize) {
    return {
      valid: false,
      error: `Event payload size (${payloadSize} bytes) exceeds maximum allowed size (${policy.maxPayloadSize} bytes)`
    };
  }

  return { valid: true };
}

/**
 * Validates a JWT token from event metadata
 * 
 * @param token The JWT token to validate
 * @param journey The journey type for journey-specific validation rules
 * @returns Validation result with valid flag and optional error message
 */
export function validateEventJwt(
  token: string,
  journey: JourneyType
): SourceValidationResult {
  // This is a placeholder for actual JWT validation logic
  // In a real implementation, this would validate the token signature,
  // expiration, issuer, and other claims
  
  if (!token) {
    return {
      valid: false,
      error: 'JWT token is required'
    };
  }

  // Basic structure validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: 'Invalid JWT token format'
    };
  }

  try {
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        error: 'JWT token has expired'
      };
    }

    // Check if the token has the necessary permissions for this journey
    if (!payload.journeys || !payload.journeys.includes(journey)) {
      return {
        valid: false,
        error: `JWT token does not have permission for journey: ${journey}`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate JWT token: ${error.message}`
    };
  }
}

/**
 * Secures an event by applying all security measures: sanitization, source validation,
 * payload size validation, and JWT validation
 * 
 * @param event The event to secure
 * @param journey The journey type for journey-specific security rules
 * @param options Options for security behavior
 * @returns The secured event or throws an error if validation fails
 */
export function secureEvent<T extends Record<string, any>>(
  event: T & { source?: string; metadata?: { jwt?: string } },
  journey: JourneyType,
  options: SanitizeOptions & { throwOnValidationFailure?: boolean } = {}
): T {
  const { throwOnValidationFailure = true, ...sanitizeOptions } = options;

  // Validate event source
  if (event.source) {
    const sourceValidation = validateEventSource(event.source, journey);
    if (!sourceValidation.valid && throwOnValidationFailure) {
      throw new Error(sourceValidation.error);
    }
  }

  // Validate payload size
  const sizeValidation = validatePayloadSize(event, journey);
  if (!sizeValidation.valid && throwOnValidationFailure) {
    throw new Error(sizeValidation.error);
  }

  // Validate JWT if present and required by the journey's security policy
  const policy = defaultSecurityPolicies[journey];
  if (policy?.validateJwt && event.metadata?.jwt) {
    const jwtValidation = validateEventJwt(event.metadata.jwt, journey);
    if (!jwtValidation.valid && throwOnValidationFailure) {
      throw new Error(jwtValidation.error);
    }
  }

  // Sanitize the event payload
  return sanitizeEventPayload(event, journey, sanitizeOptions);
}

/**
 * Creates a journey-specific security policy by extending the default policy
 * 
 * @param journey The journey type
 * @param policyOverrides Partial policy to override default values
 * @returns The complete security policy
 */
export function createJourneySecurityPolicy(
  journey: JourneyType,
  policyOverrides: Partial<EventSecurityPolicy>
): EventSecurityPolicy {
  const defaultPolicy = defaultSecurityPolicies[journey];
  if (!defaultPolicy) {
    throw new Error(`No default security policy found for journey: ${journey}`);
  }

  return {
    ...defaultPolicy,
    ...policyOverrides,
    // Merge arrays instead of replacing them
    sensitiveFields: [
      ...defaultPolicy.sensitiveFields,
      ...(policyOverrides.sensitiveFields || [])
    ],
    maskedFields: {
      ...defaultPolicy.maskedFields,
      ...(policyOverrides.maskedFields || {})
    },
    allowedSources: [
      ...defaultPolicy.allowedSources,
      ...(policyOverrides.allowedSources || [])
    ]
  };
}
import { EventTypes } from '../dto/event-types.enum';

/**
 * Represents a security policy for event payloads
 * Defines what fields should be sanitized and how
 */
export interface EventSecurityPolicy {
  /**
   * Fields that should be completely removed from the payload
   */
  sensitiveFields: string[];
  
  /**
   * Fields that should be masked (e.g., partial display)
   */
  maskedFields?: Record<string, (value: any) => any>;
  
  /**
   * Fields that should be encrypted
   */
  encryptedFields?: string[];
  
  /**
   * Allowed sources for this event type
   */
  allowedSources?: string[];
}

/**
 * Map of event types to their security policies
 */
const eventSecurityPolicies: Record<string, EventSecurityPolicy> = {
  // Health journey events
  [EventTypes.HEALTH_METRIC_RECORDED]: {
    sensitiveFields: ['deviceId', 'rawData'],
    maskedFields: {
      userId: (value) => maskUserId(value),
    },
    allowedSources: ['health-service', 'mobile-app', 'web-app'],
  },
  [EventTypes.HEALTH_GOAL_ACHIEVED]: {
    sensitiveFields: ['deviceId'],
    maskedFields: {
      userId: (value) => maskUserId(value),
    },
    allowedSources: ['health-service', 'gamification-engine'],
  },
  
  // Care journey events
  [EventTypes.APPOINTMENT_BOOKED]: {
    sensitiveFields: ['providerNotes', 'medicalRecordId', 'insuranceDetails'],
    maskedFields: {
      userId: (value) => maskUserId(value),
      phoneNumber: (value) => maskPhoneNumber(value),
    },
    allowedSources: ['care-service', 'mobile-app', 'web-app'],
  },
  [EventTypes.MEDICATION_TAKEN]: {
    sensitiveFields: ['prescriptionId', 'dosageDetails', 'medicationNotes'],
    maskedFields: {
      userId: (value) => maskUserId(value),
    },
    allowedSources: ['care-service', 'mobile-app'],
  },
  
  // Plan journey events
  [EventTypes.CLAIM_SUBMITTED]: {
    sensitiveFields: ['bankDetails', 'documentIds', 'claimEvidence'],
    maskedFields: {
      userId: (value) => maskUserId(value),
      claimAmount: (value) => value ? `${value.toString().charAt(0)}XXX` : value,
    },
    allowedSources: ['plan-service', 'mobile-app', 'web-app'],
  },
  [EventTypes.BENEFIT_USED]: {
    sensitiveFields: ['transactionDetails', 'benefitCode'],
    maskedFields: {
      userId: (value) => maskUserId(value),
    },
    allowedSources: ['plan-service'],
  },
};

/**
 * Default security policy for events without a specific policy
 */
const defaultSecurityPolicy: EventSecurityPolicy = {
  sensitiveFields: ['password', 'token', 'secret', 'key', 'credential', 'authorization'],
  maskedFields: {
    userId: (value) => maskUserId(value),
    email: (value) => maskEmail(value),
    phoneNumber: (value) => maskPhoneNumber(value),
  },
  allowedSources: ['api-gateway', 'auth-service', 'health-service', 'care-service', 'plan-service', 'gamification-engine', 'notification-service', 'mobile-app', 'web-app'],
};

/**
 * Masks a user ID by showing only the first and last characters
 * @param userId The user ID to mask
 * @returns The masked user ID
 */
export function maskUserId(userId: string): string {
  if (!userId || userId.length < 4) return userId;
  return `${userId.substring(0, 2)}...${userId.substring(userId.length - 2)}`;
}

/**
 * Masks an email address by showing only the first 2 characters of the username
 * @param email The email to mask
 * @returns The masked email
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  return `${username.substring(0, 2)}...@${domain}`;
}

/**
 * Masks a phone number by showing only the last 4 digits
 * @param phoneNumber The phone number to mask
 * @returns The masked phone number
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length < 4) return phoneNumber;
  return `XXX-XXX-${phoneNumber.substring(phoneNumber.length - 4)}`;
}

/**
 * Gets the security policy for a specific event type
 * @param eventType The event type
 * @returns The security policy for the event type
 */
export function getSecurityPolicy(eventType: string): EventSecurityPolicy {
  return eventSecurityPolicies[eventType] || defaultSecurityPolicy;
}

/**
 * Sanitizes an event payload by removing or masking sensitive fields
 * @param eventType The type of event
 * @param payload The event payload to sanitize
 * @returns A sanitized copy of the payload
 */
export function sanitizeEventPayload<T extends Record<string, any>>(eventType: string, payload: T): T {
  const policy = getSecurityPolicy(eventType);
  const sanitizedPayload = { ...payload };
  
  // Remove sensitive fields
  for (const field of policy.sensitiveFields) {
    if (field.includes('.')) {
      // Handle nested fields
      const parts = field.split('.');
      let current = sanitizedPayload;
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]]) {
          current = current[parts[i]];
        } else {
          break;
        }
      }
      if (current) {
        delete current[parts[parts.length - 1]];
      }
    } else {
      // Handle top-level fields
      delete sanitizedPayload[field];
    }
  }
  
  // Apply masking to specified fields
  if (policy.maskedFields) {
    for (const [field, maskFn] of Object.entries(policy.maskedFields)) {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        let current = sanitizedPayload;
        for (let i = 0; i < parts.length - 1; i++) {
          if (current[parts[i]]) {
            current = current[parts[i]];
          } else {
            break;
          }
        }
        const lastPart = parts[parts.length - 1];
        if (current && current[lastPart] !== undefined) {
          current[lastPart] = maskFn(current[lastPart]);
        }
      } else {
        // Handle top-level fields
        if (sanitizedPayload[field] !== undefined) {
          sanitizedPayload[field] = maskFn(sanitizedPayload[field]);
        }
      }
    }
  }
  
  return sanitizedPayload;
}

/**
 * Validates that an event comes from an authorized source
 * @param eventType The type of event
 * @param source The source of the event
 * @returns True if the source is authorized for this event type, false otherwise
 */
export function validateEventSource(eventType: string, source: string): boolean {
  const policy = getSecurityPolicy(eventType);
  
  if (!policy.allowedSources || policy.allowedSources.length === 0) {
    return true; // No restrictions
  }
  
  return policy.allowedSources.includes(source);
}

/**
 * Validates that an event payload doesn't contain malicious content
 * Checks for potential injection attacks in the payload
 * @param payload The event payload to validate
 * @returns True if the payload is safe, false if it contains potentially malicious content
 */
export function validateEventPayloadSafety(payload: Record<string, any>): boolean {
  // Convert payload to string for analysis
  const payloadStr = JSON.stringify(payload);
  
  // Check for potential script injection
  if (/<script[\s\S]*?>/i.test(payloadStr)) {
    return false;
  }
  
  // Check for potential SQL injection patterns
  if (/('\s*(or|and)\s*'\s*=\s*')|(-{2})/i.test(payloadStr)) {
    return false;
  }
  
  // Check for potential command injection
  if (/([;&|`]\s*\w+)/i.test(payloadStr)) {
    return false;
  }
  
  return true;
}

/**
 * Creates a secure event object with sanitized payload and source validation
 * @param eventType The type of event
 * @param payload The event payload
 * @param source The source of the event
 * @returns A secure event object or throws an error if validation fails
 */
export function createSecureEvent<T extends Record<string, any>>(
  eventType: string,
  payload: T,
  source: string
): { type: string; payload: T; source: string; timestamp: string } {
  // Validate event source
  if (!validateEventSource(eventType, source)) {
    throw new Error(`Unauthorized source '${source}' for event type '${eventType}'`);
  }
  
  // Validate payload safety
  if (!validateEventPayloadSafety(payload)) {
    throw new Error(`Event payload for '${eventType}' contains potentially malicious content`);
  }
  
  // Sanitize the payload
  const sanitizedPayload = sanitizeEventPayload(eventType, payload);
  
  // Create the secure event
  return {
    type: eventType,
    payload: sanitizedPayload,
    source,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates an event against journey-specific security policies
 * @param eventType The type of event
 * @param journey The journey the event belongs to
 * @param payload The event payload
 * @returns True if the event passes journey-specific validation, false otherwise
 */
export function validateJourneyEventSecurity(
  eventType: string,
  journey: 'health' | 'care' | 'plan',
  payload: Record<string, any>
): boolean {
  // Validate that the event type belongs to the specified journey
  if (eventType.startsWith('HEALTH_') && journey !== 'health') {
    return false;
  }
  
  if ((eventType.startsWith('APPOINTMENT_') || eventType.startsWith('MEDICATION_') || eventType.startsWith('TELEMEDICINE_')) && journey !== 'care') {
    return false;
  }
  
  if ((eventType.startsWith('CLAIM_') || eventType.startsWith('BENEFIT_') || eventType.startsWith('PLAN_')) && journey !== 'plan') {
    return false;
  }
  
  // Additional journey-specific validation could be added here
  
  return true;
}

/**
 * Comprehensive event security validation
 * Combines source validation, payload safety, and journey-specific validation
 * @param eventType The type of event
 * @param payload The event payload
 * @param source The source of the event
 * @param journey The journey the event belongs to
 * @returns An object with validation result and any error messages
 */
export function validateEventSecurity(
  eventType: string,
  payload: Record<string, any>,
  source: string,
  journey?: 'health' | 'care' | 'plan'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate event source
  if (!validateEventSource(eventType, source)) {
    errors.push(`Unauthorized source '${source}' for event type '${eventType}'`);
  }
  
  // Validate payload safety
  if (!validateEventPayloadSafety(payload)) {
    errors.push(`Event payload contains potentially malicious content`);
  }
  
  // Validate journey-specific security if journey is provided
  if (journey && !validateJourneyEventSecurity(eventType, journey, payload)) {
    errors.push(`Event type '${eventType}' is not valid for journey '${journey}'`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
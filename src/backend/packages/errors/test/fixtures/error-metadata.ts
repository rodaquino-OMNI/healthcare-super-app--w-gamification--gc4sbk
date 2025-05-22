/**
 * Error Metadata Test Fixtures
 * 
 * This file provides standardized test fixtures for error context, metadata, and serialization
 * to be used in testing error enrichment, transformation, and formatting throughout the application.
 * 
 * It includes sample user contexts, request metadata, application states, and expected serialized
 * outputs for various error scenarios across different journeys.
 */

import { ErrorType } from '@austa/interfaces/common';

// ===== USER CONTEXT FIXTURES =====

/**
 * Sample user contexts for testing error enrichment with user information
 */
export const userContexts = {
  /**
   * Standard authenticated user context
   */
  standard: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    roles: ['user'],
    permissions: ['read:health', 'write:health', 'read:care', 'read:plan'],
    preferences: {
      language: 'pt-BR',
      notifications: true
    }
  },
  
  /**
   * Admin user context with elevated permissions
   */
  admin: {
    userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    email: 'admin@austa.health',
    roles: ['admin', 'user'],
    permissions: ['*'],
    preferences: {
      language: 'pt-BR',
      notifications: true
    }
  },
  
  /**
   * Healthcare provider user context
   */
  provider: {
    userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'doctor@austa.health',
    roles: ['provider', 'user'],
    permissions: ['read:health', 'write:health', 'read:care', 'write:care', 'read:plan'],
    providerDetails: {
      providerId: 'PROV-12345',
      specialization: 'Cardiologist',
      licenseNumber: 'CRM-12345'
    },
    preferences: {
      language: 'pt-BR',
      notifications: true
    }
  },
  
  /**
   * Unauthenticated/anonymous user context
   */
  anonymous: {
    userId: null,
    roles: ['anonymous'],
    permissions: ['read:public']
  }
};

// ===== SESSION CONTEXT FIXTURES =====

/**
 * Sample session contexts for testing error enrichment with session information
 */
export const sessionContexts = {
  /**
   * Active web session
   */
  activeWeb: {
    sessionId: 'sess_01H1VECTBP4GXKRM69ZJDVJ1XP',
    deviceInfo: {
      type: 'web',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ip: '192.168.1.1'
    },
    createdAt: '2023-06-15T10:30:00Z',
    expiresAt: '2023-06-15T22:30:00Z',
    isActive: true
  },
  
  /**
   * Active mobile session
   */
  activeMobile: {
    sessionId: 'sess_01H1VECTBP4GXKRM69ZJDVJ1XQ',
    deviceInfo: {
      type: 'mobile',
      userAgent: 'AUSTA-SuperApp/1.0.0 (iPhone; iOS 15.0; Scale/3.00)',
      ip: '192.168.1.2',
      deviceId: 'iphone12-AABBCCDD'
    },
    createdAt: '2023-06-15T10:30:00Z',
    expiresAt: '2023-06-15T22:30:00Z',
    isActive: true
  },
  
  /**
   * Expired session
   */
  expired: {
    sessionId: 'sess_01H1VECTBP4GXKRM69ZJDVJ1XR',
    deviceInfo: {
      type: 'web',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ip: '192.168.1.3'
    },
    createdAt: '2023-06-14T10:30:00Z',
    expiresAt: '2023-06-14T22:30:00Z',
    isActive: false
  }
};

// ===== REQUEST CONTEXT FIXTURES =====

/**
 * Sample request contexts for testing error enrichment with request information
 */
export const requestContexts = {
  /**
   * GraphQL API request
   */
  graphql: {
    requestId: 'req_01H1VECTBP4GXKRM69ZJDVJ1XS',
    traceId: 'trace_01H1VECTBP4GXKRM69ZJDVJ1XT',
    timestamp: '2023-06-15T14:35:42Z',
    method: 'POST',
    path: '/graphql',
    query: '{ user { profile { name email } } }',
    variables: {},
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'x-request-id': 'req_01H1VECTBP4GXKRM69ZJDVJ1XS',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  },
  
  /**
   * REST API request
   */
  rest: {
    requestId: 'req_01H1VECTBP4GXKRM69ZJDVJ1XU',
    traceId: 'trace_01H1VECTBP4GXKRM69ZJDVJ1XV',
    timestamp: '2023-06-15T14:36:42Z',
    method: 'GET',
    path: '/api/health/metrics',
    query: 'from=2023-06-01&to=2023-06-15',
    params: {
      from: '2023-06-01',
      to: '2023-06-15'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'x-request-id': 'req_01H1VECTBP4GXKRM69ZJDVJ1XU',
      'user-agent': 'AUSTA-SuperApp/1.0.0 (iPhone; iOS 15.0; Scale/3.00)'
    }
  },
  
  /**
   * Internal service-to-service request
   */
  internal: {
    requestId: 'req_01H1VECTBP4GXKRM69ZJDVJ1XW',
    traceId: 'trace_01H1VECTBP4GXKRM69ZJDVJ1XX',
    timestamp: '2023-06-15T14:37:42Z',
    method: 'POST',
    path: '/internal/gamification/events',
    source: 'health-service',
    destination: 'gamification-engine',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req_01H1VECTBP4GXKRM69ZJDVJ1XW',
      'x-source-service': 'health-service',
      'x-api-key': 'internal_api_key_123'
    }
  }
};

// ===== JOURNEY CONTEXT FIXTURES =====

/**
 * Sample journey contexts for testing journey-specific error handling
 */
export const journeyContexts = {
  /**
   * Health journey context
   */
  health: {
    journeyType: 'health',
    journeyStage: 'metrics-tracking',
    feature: 'blood-pressure-recording',
    metadata: {
      metricId: 'bp_01H1VECTBP4GXKRM69ZJDVJ1XY',
      deviceId: 'device_01H1VECTBP4GXKRM69ZJDVJ1XZ',
      readingTimestamp: '2023-06-15T14:30:00Z'
    }
  },
  
  /**
   * Care journey context
   */
  care: {
    journeyType: 'care',
    journeyStage: 'appointment-booking',
    feature: 'provider-selection',
    metadata: {
      appointmentId: 'appt_01H1VECTBP4GXKRM69ZJDVJ1Y0',
      providerId: 'provider_01H1VECTBP4GXKRM69ZJDVJ1Y1',
      specialtyId: 'specialty_01H1VECTBP4GXKRM69ZJDVJ1Y2',
      appointmentDate: '2023-06-20T10:00:00Z'
    }
  },
  
  /**
   * Plan journey context
   */
  plan: {
    journeyType: 'plan',
    journeyStage: 'claim-submission',
    feature: 'document-upload',
    metadata: {
      claimId: 'claim_01H1VECTBP4GXKRM69ZJDVJ1Y3',
      documentIds: ['doc_01H1VECTBP4GXKRM69ZJDVJ1Y4', 'doc_01H1VECTBP4GXKRM69ZJDVJ1Y5'],
      claimType: 'medical',
      claimAmount: 250.75
    }
  },
  
  /**
   * Gamification context
   */
  gamification: {
    journeyType: 'gamification',
    journeyStage: 'achievement-processing',
    feature: 'xp-calculation',
    metadata: {
      achievementId: 'achievement_01H1VECTBP4GXKRM69ZJDVJ1Y6',
      profileId: 'profile_01H1VECTBP4GXKRM69ZJDVJ1Y7',
      xpAwarded: 50,
      achievementType: 'health-milestone'
    }
  }
};

// ===== APPLICATION CONTEXT FIXTURES =====

/**
 * Sample application contexts for testing error enrichment with application state
 */
export const applicationContexts = {
  /**
   * Health service context
   */
  healthService: {
    serviceName: 'health-service',
    version: '1.5.2',
    environment: 'production',
    nodeId: 'node-01',
    podName: 'health-service-prod-7d9f6b9b6b-2x4qz',
    region: 'us-east-1',
    deploymentTimestamp: '2023-06-10T00:00:00Z'
  },
  
  /**
   * Care service context
   */
  careService: {
    serviceName: 'care-service',
    version: '1.4.8',
    environment: 'production',
    nodeId: 'node-02',
    podName: 'care-service-prod-7d9f6b9b6b-3x5qz',
    region: 'us-east-1',
    deploymentTimestamp: '2023-06-09T00:00:00Z'
  },
  
  /**
   * Plan service context
   */
  planService: {
    serviceName: 'plan-service',
    version: '1.3.5',
    environment: 'production',
    nodeId: 'node-03',
    podName: 'plan-service-prod-7d9f6b9b6b-4x6qz',
    region: 'us-east-1',
    deploymentTimestamp: '2023-06-08T00:00:00Z'
  },
  
  /**
   * Gamification engine context
   */
  gamificationEngine: {
    serviceName: 'gamification-engine',
    version: '1.6.1',
    environment: 'production',
    nodeId: 'node-04',
    podName: 'gamification-engine-prod-7d9f6b9b6b-5x7qz',
    region: 'us-east-1',
    deploymentTimestamp: '2023-06-11T00:00:00Z'
  }
};

// ===== ERROR CLASSIFICATION FIXTURES =====

/**
 * Sample error classification examples for different error types
 */
export const errorClassifications = {
  /**
   * Validation error examples
   */
  validation: {
    type: ErrorType.VALIDATION,
    examples: [
      {
        code: 'VALIDATION_001',
        message: 'Invalid input data',
        details: {
          field: 'email',
          constraint: 'isEmail',
          value: 'invalid-email'
        }
      },
      {
        code: 'VALIDATION_002',
        message: 'Required field missing',
        details: {
          field: 'password',
          constraint: 'isNotEmpty'
        }
      },
      {
        code: 'VALIDATION_003',
        message: 'Value out of range',
        details: {
          field: 'age',
          constraint: 'min',
          value: 5,
          min: 18
        }
      }
    ]
  },
  
  /**
   * Business logic error examples
   */
  business: {
    type: ErrorType.BUSINESS,
    examples: [
      {
        code: 'HEALTH_001',
        message: 'Health metric value outside physiological range',
        details: {
          metricType: 'blood-pressure',
          value: '220/180',
          acceptableRange: '70-180/40-120'
        }
      },
      {
        code: 'CARE_001',
        message: 'Appointment slot already booked',
        details: {
          providerId: 'provider_01H1VECTBP4GXKRM69ZJDVJ1Y1',
          appointmentTime: '2023-06-20T10:00:00Z',
          status: 'booked'
        }
      },
      {
        code: 'PLAN_001',
        message: 'Claim amount exceeds coverage limit',
        details: {
          claimAmount: 5000,
          coverageLimit: 3000,
          coverageType: 'dental'
        }
      }
    ]
  },
  
  /**
   * Technical error examples
   */
  technical: {
    type: ErrorType.TECHNICAL,
    examples: [
      {
        code: 'TECH_001',
        message: 'Database connection failed',
        details: {
          database: 'health-metrics',
          operation: 'read',
          errorCode: 'ECONNREFUSED'
        }
      },
      {
        code: 'TECH_002',
        message: 'Unexpected error during data processing',
        details: {
          operation: 'calculateHealthScore',
          errorType: 'NullPointerException'
        }
      },
      {
        code: 'TECH_003',
        message: 'Cache service unavailable',
        details: {
          cacheService: 'redis',
          operation: 'set',
          key: 'user:profile:550e8400-e29b-41d4-a716-446655440000'
        }
      }
    ]
  },
  
  /**
   * External system error examples
   */
  external: {
    type: ErrorType.EXTERNAL,
    examples: [
      {
        code: 'EXT_001',
        message: 'Payment gateway service unavailable',
        details: {
          service: 'payment-gateway',
          operation: 'processPayment',
          statusCode: 503
        }
      },
      {
        code: 'EXT_002',
        message: 'FHIR API returned invalid response',
        details: {
          service: 'fhir-api',
          operation: 'getPatientRecord',
          statusCode: 400,
          responseBody: '{"error":"Invalid patient identifier"}'
        }
      },
      {
        code: 'EXT_003',
        message: 'Wearable device API connection timeout',
        details: {
          service: 'fitbit-api',
          operation: 'syncHealthData',
          errorCode: 'ETIMEDOUT'
        }
      }
    ]
  }
};

// ===== SERIALIZED ERROR FIXTURES =====

/**
 * Expected serialized error formats for different scenarios
 */
export const serializedErrors = {
  /**
   * Client-friendly error response (minimal details)
   */
  clientFriendly: {
    error: {
      type: 'validation',
      code: 'VALIDATION_001',
      message: 'Invalid email format',
      details: {
        field: 'email',
        constraint: 'isEmail'
      }
    }
  },
  
  /**
   * Detailed error for logging (includes context)
   */
  detailedLogging: {
    error: {
      type: 'business',
      code: 'HEALTH_001',
      message: 'Health metric value outside physiological range',
      details: {
        metricType: 'blood-pressure',
        value: '220/180',
        acceptableRange: '70-180/40-120'
      },
      context: {
        request: {
          requestId: 'req_01H1VECTBP4GXKRM69ZJDVJ1XU',
          traceId: 'trace_01H1VECTBP4GXKRM69ZJDVJ1XV',
          method: 'POST',
          path: '/api/health/metrics'
        },
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          roles: ['user']
        },
        journey: {
          journeyType: 'health',
          journeyStage: 'metrics-tracking',
          feature: 'blood-pressure-recording'
        },
        application: {
          serviceName: 'health-service',
          version: '1.5.2',
          environment: 'production'
        },
        timestamp: '2023-06-15T14:36:42Z'
      }
    }
  },
  
  /**
   * Error with retry information
   */
  withRetryInfo: {
    error: {
      type: 'external',
      code: 'EXT_001',
      message: 'Payment gateway service unavailable',
      details: {
        service: 'payment-gateway',
        operation: 'processPayment',
        statusCode: 503
      },
      retry: {
        retryable: true,
        retryCount: 3,
        retryAfter: 5000, // ms
        nextRetryAt: '2023-06-15T14:37:47Z',
        backoffStrategy: 'exponential'
      }
    }
  },
  
  /**
   * Error with circuit breaker information
   */
  withCircuitBreakerInfo: {
    error: {
      type: 'external',
      code: 'EXT_002',
      message: 'FHIR API returned invalid response',
      details: {
        service: 'fhir-api',
        operation: 'getPatientRecord',
        statusCode: 400
      },
      circuitBreaker: {
        status: 'open',
        failureCount: 5,
        lastFailureAt: '2023-06-15T14:35:42Z',
        resetAt: '2023-06-15T14:40:42Z'
      }
    }
  },
  
  /**
   * Error with fallback information
   */
  withFallbackInfo: {
    error: {
      type: 'technical',
      code: 'TECH_001',
      message: 'Database connection failed',
      details: {
        database: 'health-metrics',
        operation: 'read',
        errorCode: 'ECONNREFUSED'
      },
      fallback: {
        strategy: 'cached-data',
        dataSource: 'redis-cache',
        dataFreshness: '15m',
        cachedAt: '2023-06-15T14:20:42Z'
      }
    }
  }
};

// ===== RETRY AND RECOVERY METADATA =====

/**
 * Sample retry and recovery metadata for testing error handling strategies
 */
export const retryAndRecoveryMetadata = {
  /**
   * Retry strategies
   */
  retryStrategies: {
    /**
     * Fixed delay retry strategy
     */
    fixed: {
      strategy: 'fixed',
      delay: 1000, // ms
      maxRetries: 3,
      retryableErrors: ['EXT_001', 'EXT_003', 'TECH_001', 'TECH_003']
    },
    
    /**
     * Exponential backoff retry strategy
     */
    exponential: {
      strategy: 'exponential',
      initialDelay: 1000, // ms
      factor: 2,
      maxDelay: 30000, // ms
      maxRetries: 5,
      retryableErrors: ['EXT_001', 'EXT_003', 'TECH_001', 'TECH_003']
    },
    
    /**
     * Random jitter retry strategy
     */
    jitter: {
      strategy: 'jitter',
      minDelay: 1000, // ms
      maxDelay: 5000, // ms
      maxRetries: 4,
      retryableErrors: ['EXT_001', 'EXT_003', 'TECH_001', 'TECH_003']
    }
  },
  
  /**
   * Circuit breaker configurations
   */
  circuitBreakers: {
    /**
     * Default circuit breaker configuration
     */
    default: {
      failureThreshold: 5,
      resetTimeout: 30000, // ms
      monitoredErrors: ['EXT_001', 'EXT_002', 'EXT_003']
    },
    
    /**
     * Sensitive circuit breaker configuration (for critical services)
     */
    sensitive: {
      failureThreshold: 3,
      resetTimeout: 60000, // ms
      monitoredErrors: ['EXT_001', 'EXT_002', 'EXT_003', 'TECH_001']
    }
  },
  
  /**
   * Fallback strategies
   */
  fallbackStrategies: {
    /**
     * Cached data fallback strategy
     */
    cachedData: {
      strategy: 'cached-data',
      maxAge: 900000, // 15 minutes in ms
      applicableErrors: ['TECH_001', 'EXT_001', 'EXT_002', 'EXT_003']
    },
    
    /**
     * Default value fallback strategy
     */
    defaultValue: {
      strategy: 'default-value',
      applicableErrors: ['TECH_001', 'TECH_002', 'EXT_001', 'EXT_002', 'EXT_003']
    },
    
    /**
     * Degraded service fallback strategy
     */
    degradedService: {
      strategy: 'degraded-service',
      features: {
        'health-tracking': {
          degradedMode: 'manual-entry-only',
          disabledIntegrations: ['wearables', 'health-devices']
        },
        'appointment-booking': {
          degradedMode: 'view-only',
          disabledIntegrations: ['provider-calendar']
        },
        'claim-submission': {
          degradedMode: 'offline-submission',
          disabledIntegrations: ['payment-gateway', 'document-processing']
        }
      },
      applicableErrors: ['TECH_001', 'TECH_003', 'EXT_001', 'EXT_002', 'EXT_003']
    }
  }
};
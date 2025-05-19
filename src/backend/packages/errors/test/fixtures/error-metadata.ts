/**
 * Error Metadata Test Fixtures
 * 
 * This file provides standardized test fixtures for error context, metadata, and serialization
 * to ensure consistent testing of error enrichment, transformation, and formatting across
 * the AUSTA SuperApp.
 */

import { ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * User context information for error testing
 */
export const userContexts = {
  // Standard authenticated user
  standard: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    roles: ['user'],
    permissions: ['read:profile', 'update:profile'],
    sessionId: 'sess_12345abcde',
    authMethod: 'password',
    lastLogin: '2023-04-15T10:30:45Z'
  },
  
  // Admin user with elevated permissions
  admin: {
    userId: '7d793789-9d9a-4e6d-a5c8-e4f101e5b8a7',
    email: 'admin@austa.health',
    roles: ['admin', 'user'],
    permissions: ['read:all', 'write:all', 'admin:system'],
    sessionId: 'sess_admin67890',
    authMethod: 'mfa',
    lastLogin: '2023-04-16T08:15:22Z'
  },
  
  // Healthcare provider
  provider: {
    userId: '9b2de0f4-95c6-4e91-90e9-8b2b0b4e1d1c',
    email: 'doctor@hospital.org',
    roles: ['provider', 'user'],
    permissions: ['read:patients', 'write:medical_records', 'schedule:appointments'],
    sessionId: 'sess_provider54321',
    authMethod: 'sso',
    lastLogin: '2023-04-16T09:45:10Z',
    providerDetails: {
      providerId: 'prov_12345',
      specialization: 'Cardiology',
      hospitalId: 'hosp_789'
    }
  },
  
  // Unauthenticated user
  anonymous: {
    sessionId: 'sess_anon98765',
    authMethod: 'none'
  }
};

/**
 * Request metadata for error context testing
 */
export const requestMetadata = {
  // Web application request
  web: {
    requestId: 'req_web_7d9a8b6c5d',
    timestamp: '2023-04-16T14:22:36Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    path: '/api/health/metrics',
    method: 'GET',
    correlationId: 'corr_7d9a8b6c5d4e3f2a1b',
    origin: 'https://app.austa.health',
    referer: 'https://app.austa.health/dashboard'
  },
  
  // Mobile application request
  mobile: {
    requestId: 'req_mob_3f2a1b9c8d',
    timestamp: '2023-04-16T14:25:12Z',
    ipAddress: '203.0.113.45',
    userAgent: 'AUSTA-Health-App/2.1.0 (iPhone; iOS 16.2; Scale/3.00)',
    path: '/api/care/appointments',
    method: 'POST',
    correlationId: 'corr_3f2a1b9c8d7e6f5a4b',
    deviceId: 'iphone12_7d9a8b6c5d',
    appVersion: '2.1.0',
    osVersion: 'iOS 16.2'
  },
  
  // Internal service-to-service request
  service: {
    requestId: 'req_svc_5a4b3c2d1e',
    timestamp: '2023-04-16T14:26:05Z',
    sourceService: 'health-service',
    targetService: 'gamification-engine',
    path: '/internal/events',
    method: 'POST',
    correlationId: 'corr_5a4b3c2d1e9f8g7h6i',
    traceId: 'trace_5a4b3c2d1e9f8g7h6i5j4k'
  }
};

/**
 * Application state contexts for different journeys
 */
export const applicationStates = {
  // Health journey context
  health: {
    journey: 'health',
    feature: 'metrics',
    operation: 'recordMetric',
    metricType: 'bloodPressure',
    deviceId: 'dev_smartwatch_123',
    goalId: 'goal_bp_normal_range'
  },
  
  // Care journey context
  care: {
    journey: 'care',
    feature: 'appointments',
    operation: 'scheduleAppointment',
    providerId: 'prov_12345',
    specialtyId: 'spec_cardiology',
    appointmentType: 'video',
    facilityId: 'fac_downtown_clinic'
  },
  
  // Plan journey context
  plan: {
    journey: 'plan',
    feature: 'claims',
    operation: 'submitClaim',
    planId: 'plan_premium_family',
    benefitId: 'ben_prescription',
    claimAmount: 125.50,
    serviceDate: '2023-04-10T00:00:00Z'
  },
  
  // Gamification context
  gamification: {
    journey: 'gamification',
    feature: 'achievements',
    operation: 'unlockAchievement',
    achievementId: 'ach_health_streak_7days',
    points: 50,
    level: 3
  }
};

/**
 * Expected serialized error formats for different error types
 */
export const serializedErrors = {
  // Validation error (HTTP 400)
  validation: {
    statusCode: 400,
    error: {
      type: ErrorType.VALIDATION,
      code: 'HEALTH_001',
      message: 'Invalid blood pressure reading format',
      details: {
        fields: {
          systolic: 'Must be a number between 70 and 220',
          diastolic: 'Must be a number between 40 and 120'
        },
        value: {
          systolic: 'abc',
          diastolic: 90
        }
      },
      context: {
        requestId: 'req_mob_3f2a1b9c8d',
        timestamp: '2023-04-16T14:25:12Z',
        journey: 'health',
        feature: 'metrics'
      }
    }
  },
  
  // Business logic error (HTTP 422)
  business: {
    statusCode: 422,
    error: {
      type: ErrorType.BUSINESS,
      code: 'CARE_003',
      message: 'Cannot schedule appointment outside of provider availability',
      details: {
        requestedTime: '2023-05-01T14:00:00Z',
        availableSlots: [
          '2023-05-01T10:00:00Z',
          '2023-05-01T11:00:00Z',
          '2023-05-01T15:00:00Z'
        ]
      },
      context: {
        requestId: 'req_web_7d9a8b6c5d',
        timestamp: '2023-04-16T14:22:36Z',
        journey: 'care',
        feature: 'appointments'
      }
    }
  },
  
  // Technical error (HTTP 500)
  technical: {
    statusCode: 500,
    error: {
      type: ErrorType.TECHNICAL,
      code: 'SYSTEM_002',
      message: 'Database connection failed',
      details: {
        operation: 'query',
        table: 'health_metrics'
      },
      context: {
        requestId: 'req_svc_5a4b3c2d1e',
        timestamp: '2023-04-16T14:26:05Z',
        service: 'health-service'
      }
    }
  },
  
  // External system error (HTTP 502)
  external: {
    statusCode: 502,
    error: {
      type: ErrorType.EXTERNAL,
      code: 'EXT_004',
      message: 'Failed to connect to wearable device API',
      details: {
        externalSystem: 'fitbit-api',
        operation: 'getSleepData',
        statusCode: 503,
        retryAfter: 30
      },
      context: {
        requestId: 'req_mob_3f2a1b9c8d',
        timestamp: '2023-04-16T14:25:12Z',
        journey: 'health',
        feature: 'devices'
      }
    }
  }
};

/**
 * Journey-specific error metadata samples
 */
export const journeyErrorMetadata = {
  // Health journey specific error metadata
  health: {
    // Metric recording errors
    metricRecording: {
      metricType: 'bloodPressure',
      validRanges: {
        systolic: { min: 70, max: 220 },
        diastolic: { min: 40, max: 120 }
      },
      deviceId: 'dev_smartwatch_123',
      measurementTime: '2023-04-16T14:20:00Z',
      previousReadings: [
        { timestamp: '2023-04-15T08:30:00Z', systolic: 120, diastolic: 80 },
        { timestamp: '2023-04-14T09:15:00Z', systolic: 118, diastolic: 78 }
      ]
    },
    
    // Device connection errors
    deviceConnection: {
      deviceType: 'smartwatch',
      manufacturer: 'Fitbit',
      model: 'Sense',
      connectionMethod: 'bluetooth',
      lastSyncTime: '2023-04-16T10:15:30Z',
      batteryLevel: 42,
      firmwareVersion: '2.4.1'
    },
    
    // Health goal errors
    healthGoals: {
      goalId: 'goal_bp_normal_range',
      goalType: 'bloodPressure',
      targetRange: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
      startDate: '2023-04-01T00:00:00Z',
      endDate: '2023-04-30T23:59:59Z',
      progress: 65,
      streakDays: 5
    }
  },
  
  // Care journey specific error metadata
  care: {
    // Appointment scheduling errors
    appointmentScheduling: {
      providerId: 'prov_12345',
      providerName: 'Dr. Sarah Johnson',
      specialtyId: 'spec_cardiology',
      appointmentType: 'video',
      requestedTime: '2023-05-01T14:00:00Z',
      duration: 30,
      facilityId: 'fac_downtown_clinic',
      insurancePlanId: 'plan_premium_family',
      patientNotes: 'Follow-up for medication adjustment'
    },
    
    // Medication management errors
    medicationManagement: {
      medicationId: 'med_lisinopril_10mg',
      prescriptionId: 'rx_789456',
      dosage: '10mg',
      frequency: 'once daily',
      startDate: '2023-03-15T00:00:00Z',
      endDate: '2023-06-15T00:00:00Z',
      refillsRemaining: 2,
      pharmacyId: 'pharm_cornerstone',
      lastRefillDate: '2023-04-01T00:00:00Z'
    },
    
    // Telemedicine errors
    telemedicine: {
      sessionId: 'tele_session_456789',
      providerId: 'prov_12345',
      scheduledStartTime: '2023-04-16T15:00:00Z',
      actualStartTime: '2023-04-16T15:02:35Z',
      duration: 0, // Not completed
      connectionQuality: 'poor',
      deviceType: 'mobile',
      networkType: 'cellular',
      bandwidthMbps: 1.2
    }
  },
  
  // Plan journey specific error metadata
  plan: {
    // Claims submission errors
    claimsSubmission: {
      claimId: 'claim_123456',
      planId: 'plan_premium_family',
      benefitId: 'ben_prescription',
      serviceDate: '2023-04-10T00:00:00Z',
      providerNpi: '1234567890',
      claimAmount: 125.50,
      receiptImageUrl: 'https://storage.austa.health/receipts/rx_789456.jpg',
      submissionDate: '2023-04-16T14:22:36Z',
      claimStatus: 'pending'
    },
    
    // Benefits verification errors
    benefitsVerification: {
      benefitId: 'ben_prescription',
      planId: 'plan_premium_family',
      coverageStartDate: '2023-01-01T00:00:00Z',
      coverageEndDate: '2023-12-31T23:59:59Z',
      annualLimit: 2500.00,
      usedAmount: 750.25,
      remainingAmount: 1749.75,
      coinsuranceRate: 0.2,
      deductibleMet: true
    },
    
    // Document upload errors
    documentUpload: {
      documentId: 'doc_987654',
      documentType: 'insuranceCard',
      fileName: 'insurance_card_front.jpg',
      fileSize: 1250000, // bytes
      mimeType: 'image/jpeg',
      uploadTimestamp: '2023-04-16T14:20:15Z',
      status: 'processing',
      validationErrors: ['Image resolution too low']
    }
  }
};

/**
 * Error context enrichment examples for testing decorators and middleware
 */
export const errorContextEnrichment = {
  // Basic error without context
  basic: {
    type: ErrorType.VALIDATION,
    code: 'HEALTH_001',
    message: 'Invalid blood pressure reading format',
    details: {
      fields: {
        systolic: 'Must be a number between 70 and 220',
        diastolic: 'Must be a number between 40 and 120'
      }
    }
  },
  
  // Same error with request context added
  withRequest: {
    type: ErrorType.VALIDATION,
    code: 'HEALTH_001',
    message: 'Invalid blood pressure reading format',
    details: {
      fields: {
        systolic: 'Must be a number between 70 and 220',
        diastolic: 'Must be a number between 40 and 120'
      }
    },
    context: {
      requestId: 'req_mob_3f2a1b9c8d',
      timestamp: '2023-04-16T14:25:12Z',
      ipAddress: '203.0.113.45',
      userAgent: 'AUSTA-Health-App/2.1.0 (iPhone; iOS 16.2; Scale/3.00)'
    }
  },
  
  // Error with request and user context
  withRequestAndUser: {
    type: ErrorType.VALIDATION,
    code: 'HEALTH_001',
    message: 'Invalid blood pressure reading format',
    details: {
      fields: {
        systolic: 'Must be a number between 70 and 220',
        diastolic: 'Must be a number between 40 and 120'
      }
    },
    context: {
      requestId: 'req_mob_3f2a1b9c8d',
      timestamp: '2023-04-16T14:25:12Z',
      ipAddress: '203.0.113.45',
      userAgent: 'AUSTA-Health-App/2.1.0 (iPhone; iOS 16.2; Scale/3.00)',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      sessionId: 'sess_12345abcde'
    }
  },
  
  // Fully enriched error with request, user, and application context
  fullyEnriched: {
    type: ErrorType.VALIDATION,
    code: 'HEALTH_001',
    message: 'Invalid blood pressure reading format',
    details: {
      fields: {
        systolic: 'Must be a number between 70 and 220',
        diastolic: 'Must be a number between 40 and 120'
      }
    },
    context: {
      requestId: 'req_mob_3f2a1b9c8d',
      timestamp: '2023-04-16T14:25:12Z',
      ipAddress: '203.0.113.45',
      userAgent: 'AUSTA-Health-App/2.1.0 (iPhone; iOS 16.2; Scale/3.00)',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      sessionId: 'sess_12345abcde',
      journey: 'health',
      feature: 'metrics',
      operation: 'recordMetric',
      metricType: 'bloodPressure'
    }
  }
};

/**
 * Error transformation examples for testing error interceptors and filters
 */
export const errorTransformations = {
  // Original technical error with stack trace and sensitive info
  original: {
    type: ErrorType.TECHNICAL,
    code: 'DB_ERROR_001',
    message: 'Failed to execute database query',
    details: {
      query: 'SELECT * FROM users WHERE email = ?',
      parameters: ['user@example.com'],
      databaseHost: 'db-prod-cluster.internal',
      errorCode: 'ER_ACCESS_DENIED_ERROR',
      sqlMessage: 'Access denied for user 'app_user'@'10.0.1.123' (using password: YES)'
    },
    stack: 'Error: Failed to execute database query\n    at QueryExecutor.execute (/app/src/database/query-executor.ts:42:11)\n    at UserRepository.findByEmail (/app/src/users/user.repository.ts:78:23)\n    at AuthService.validateUser (/app/src/auth/auth.service.ts:105:45)\n    at LoginController.login (/app/src/auth/login.controller.ts:28:36)'
  },
  
  // Sanitized for logging (internal systems)
  sanitizedForLogging: {
    type: ErrorType.TECHNICAL,
    code: 'DB_ERROR_001',
    message: 'Failed to execute database query',
    details: {
      query: 'SELECT * FROM users WHERE email = ?',
      parameters: ['[REDACTED]'],
      databaseHost: 'db-prod-cluster.internal',
      errorCode: 'ER_ACCESS_DENIED_ERROR',
      sqlMessage: 'Access denied for user '[REDACTED]'@'10.0.1.123' (using password: YES)'
    },
    stack: 'Error: Failed to execute database query\n    at QueryExecutor.execute (/app/src/database/query-executor.ts:42:11)\n    at UserRepository.findByEmail (/app/src/users/user.repository.ts:78:23)\n    at AuthService.validateUser (/app/src/auth/auth.service.ts:105:45)\n    at LoginController.login (/app/src/auth/login.controller.ts:28:36)',
    context: {
      requestId: 'req_web_7d9a8b6c5d',
      timestamp: '2023-04-16T14:22:36Z',
      service: 'auth-service'
    }
  },
  
  // Client-friendly version (external API response)
  clientFriendly: {
    statusCode: 500,
    error: {
      type: 'technical',
      code: 'DB_ERROR_001',
      message: 'An unexpected error occurred while processing your request',
      context: {
        requestId: 'req_web_7d9a8b6c5d',
        timestamp: '2023-04-16T14:22:36Z'
      }
    }
  }
};
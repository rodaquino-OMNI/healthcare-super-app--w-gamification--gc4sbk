/**
 * API Gateway Configuration Constants
 * 
 * This file defines constants and default values used throughout the API Gateway configuration,
 * ensuring consistency and reducing magic values. It contains journey-specific constants for
 * rate limiting, caching strategies, and service communication parameters.
 * 
 * The constants in this file provide a single source of truth for configuration defaults
 * and enable easy maintenance and updates without searching through code.
 * 
 * Key features:
 * - Semantic versioning for all packages and APIs
 * - Support for transitional periods during breaking changes
 * - Journey-specific configuration for Health, Care, and Plan journeys
 * - Standardized service communication parameters
 * - Centralized feature flags for gradual rollouts
 * 
 * @module config/constants
 * @version 1.0.0
 */

/**
 * API versioning constants
 * Following semantic versioning principles (MAJOR.MINOR.PATCH)
 */
export const API_VERSION = {
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
  DEPRECATED: [],
  SUNSET_DATE: {
    // No deprecated versions yet
  },
  // For transitional periods when breaking changes are introduced
  COMPATIBILITY: {
    // Example: 'v1': ['v2'] - v1 requests can be handled by v2 handlers with transformation
  },
  // Semantic versioning for packages
  PACKAGES: {
    API_GATEWAY: '1.0.0',
    AUTH_SERVICE: '1.0.0',
    HEALTH_SERVICE: '1.0.0',
    CARE_SERVICE: '1.0.0',
    PLAN_SERVICE: '1.0.0',
    GAMIFICATION_ENGINE: '1.0.0',
    NOTIFICATION_SERVICE: '1.0.0'
  },
  // Version header name for API requests
  HEADER_NAME: 'X-API-Version',
  // Default version to use if not specified
  DEFAULT: 'v1',
  // Version format validation regex
  FORMAT_REGEX: /^v\d+(\.\d+)?$/
};

/**
 * Default timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  // Default request timeout for external services
  REQUEST: 30000,
  // Default timeout for GraphQL operations
  GRAPHQL: 60000,
  // Default timeout for WebSocket connections
  WEBSOCKET: 30000,
  // Default timeout for health checks
  HEALTH_CHECK: 5000,
  // Journey-specific timeouts
  JOURNEY: {
    HEALTH: 45000, // Health journey may need more time for EHR integration
    CARE: 40000,   // Care journey may need more time for provider systems
    PLAN: 50000    // Plan journey may need more time for insurance systems
  }
};

/**
 * Rate limiting constants
 * Defines rate limits for different API endpoints and journeys
 */
export const RATE_LIMITS = {
  // Default rate limit for all endpoints
  DEFAULT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100  // 100 requests per minute
  },
  // Authentication endpoints (more restrictive)
  AUTH: {
    WINDOW_MS: 60000,  // 1 minute
    MAX_REQUESTS: 20    // 20 requests per minute
  },
  // Journey-specific rate limits
  JOURNEY: {
    HEALTH: {
      WINDOW_MS: 60000,  // 1 minute
      MAX_REQUESTS: 120  // 120 requests per minute (higher for health metrics)
    },
    CARE: {
      WINDOW_MS: 60000,  // 1 minute
      MAX_REQUESTS: 100  // 100 requests per minute
    },
    PLAN: {
      WINDOW_MS: 60000,  // 1 minute
      MAX_REQUESTS: 80    // 80 requests per minute
    }
  },
  // GraphQL specific rate limits
  GRAPHQL: {
    WINDOW_MS: 60000,    // 1 minute
    MAX_REQUESTS: 150,    // 150 requests per minute
    COMPLEXITY_LIMIT: 1000 // Maximum query complexity
  }
};

/**
 * Caching strategy constants
 * Defines caching TTL (Time To Live) for different types of data
 */
export const CACHE = {
  // Default cache TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes
  
  // No caching
  NO_CACHE: 0,
  
  // Journey-specific cache settings
  JOURNEY: {
    HEALTH: {
      METRICS: 60,        // 1 minute for health metrics
      GOALS: 300,         // 5 minutes for health goals
      MEDICAL_HISTORY: 900 // 15 minutes for medical history
    },
    CARE: {
      PROVIDERS: 3600,     // 1 hour for provider information
      APPOINTMENTS: 60,     // 1 minute for appointments (frequently updated)
      TREATMENTS: 600       // 10 minutes for treatment plans
    },
    PLAN: {
      COVERAGE: 3600,      // 1 hour for coverage information
      CLAIMS_STATUS: 300,   // 5 minutes for claims status
      BENEFITS: 3600        // 1 hour for benefits information
    }
  },
  
  // Authentication cache settings
  AUTH: {
    TOKEN_BLACKLIST: 86400, // 24 hours for blacklisted tokens
    USER_PROFILE: 300        // 5 minutes for user profile information
  },
  
  // Gamification cache settings
  GAMIFICATION: {
    ACHIEVEMENTS: 300,     // 5 minutes for achievements
    LEADERBOARD: 300,       // 5 minutes for leaderboard
    USER_PROGRESS: 60       // 1 minute for user progress
  }
};

/**
 * Service communication parameters
 * Defines how the API Gateway communicates with microservices
 */
export const SERVICES = {
  // Default service communication settings
  DEFAULT: {
    TIMEOUT: TIMEOUTS.REQUEST,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    CIRCUIT_BREAKER: {
      FAILURE_THRESHOLD: 5,    // Number of failures before opening circuit
      RESET_TIMEOUT: 30000,    // 30 seconds before trying again
      FALLBACK_AVAILABLE: true // Whether fallback is available
    },
    ERROR_HANDLING: {
      RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504], // Status codes that trigger retry
      CIRCUIT_BREAK_STATUS_CODES: [500, 502, 503, 504],    // Status codes that count toward circuit breaking
      FALLBACK_STATUS_CODES: [404, 500, 502, 503, 504]     // Status codes that trigger fallback
    }
  },
  
  // Service-specific settings
  AUTH_SERVICE: {
    NAME: 'auth-service',
    PORT: process.env.AUTH_SERVICE_PORT || 3001,
    TIMEOUT: 10000, // 10 seconds
    CRITICAL: true, // Critical service (gateway depends on it)
    BASE_PATH: '/auth',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.AUTH_SERVICE,
    RETRY_ATTEMPTS: 5, // More retries for critical service
    CIRCUIT_BREAKER: {
      FAILURE_THRESHOLD: 10,    // Higher threshold for critical service
      RESET_TIMEOUT: 15000,     // 15 seconds before trying again
      FALLBACK_AVAILABLE: false // No fallback for auth service
    }
  },
  HEALTH_SERVICE: {
    NAME: 'health-service',
    PORT: process.env.HEALTH_SERVICE_PORT || 3002,
    TIMEOUT: TIMEOUTS.JOURNEY.HEALTH,
    CRITICAL: false,
    BASE_PATH: '/health',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.HEALTH_SERVICE,
    JOURNEY_ID: 'health',
    ENDPOINTS: {
      METRICS: '/metrics',
      GOALS: '/goals',
      DEVICES: '/devices',
      MEDICAL_HISTORY: '/medical-history',
      FHIR: '/fhir'
    }
  },
  CARE_SERVICE: {
    NAME: 'care-service',
    PORT: process.env.CARE_SERVICE_PORT || 3003,
    TIMEOUT: TIMEOUTS.JOURNEY.CARE,
    CRITICAL: false,
    BASE_PATH: '/care',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.CARE_SERVICE,
    JOURNEY_ID: 'care',
    ENDPOINTS: {
      APPOINTMENTS: '/appointments',
      PROVIDERS: '/providers',
      TELEMEDICINE: '/telemedicine',
      MEDICATIONS: '/medications',
      TREATMENTS: '/treatments'
    }
  },
  PLAN_SERVICE: {
    NAME: 'plan-service',
    PORT: process.env.PLAN_SERVICE_PORT || 3004,
    TIMEOUT: TIMEOUTS.JOURNEY.PLAN,
    CRITICAL: false,
    BASE_PATH: '/plan',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.PLAN_SERVICE,
    JOURNEY_ID: 'plan',
    ENDPOINTS: {
      COVERAGE: '/coverage',
      CLAIMS: '/claims',
      BENEFITS: '/benefits',
      PAYMENTS: '/payments',
      DOCUMENTS: '/documents'
    }
  },
  GAMIFICATION_ENGINE: {
    NAME: 'gamification-engine',
    PORT: process.env.GAMIFICATION_ENGINE_PORT || 3005,
    TIMEOUT: 15000, // 15 seconds
    CRITICAL: false,
    BASE_PATH: '/gamification',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.GAMIFICATION_ENGINE,
    ENDPOINTS: {
      ACHIEVEMENTS: '/achievements',
      LEADERBOARD: '/leaderboard',
      QUESTS: '/quests',
      REWARDS: '/rewards',
      PROFILES: '/profiles',
      EVENTS: '/events'
    }
  },
  NOTIFICATION_SERVICE: {
    NAME: 'notification-service',
    PORT: process.env.NOTIFICATION_SERVICE_PORT || 3006,
    TIMEOUT: 10000, // 10 seconds
    CRITICAL: false,
    BASE_PATH: '/notifications',
    HEALTH_CHECK_PATH: '/health',
    VERSION: API_VERSION.PACKAGES.NOTIFICATION_SERVICE,
    ENDPOINTS: {
      SEND: '/send',
      PREFERENCES: '/preferences',
      HISTORY: '/history',
      TEMPLATES: '/templates',
      CHANNELS: '/channels'
    }
  }
};

/**
 * GraphQL specific constants
 */
export const GRAPHQL = {
  PATH: '/graphql',
  PLAYGROUND: process.env.NODE_ENV !== 'production',
  INTROSPECTION: process.env.NODE_ENV !== 'production',
  DEBUG: process.env.NODE_ENV !== 'production',
  COMPLEXITY: {
    MAX_COST: 1000,
    VARIABLES_COST: 10,
    OBJECT_COST: 2,
    LIST_FACTOR: 10,
    DEPTH_COST_FACTOR: 1.5
  },
  PERSISTED_QUERIES: {
    ENABLED: process.env.NODE_ENV === 'production',
    TTL: 86400 // 24 hours
  }
};

/**
 * Security constants
 */
export const SECURITY = {
  CORS: {
    ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Journey-ID', 'X-API-Version'],
    EXPOSED_HEADERS: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    MAX_AGE: 86400, // 24 hours
    CREDENTIALS: true
  },
  HELMET: {
    CONTENT_SECURITY_POLICY: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for GraphQL playground
        styleSrc: ["'self'", "'unsafe-inline'"],  // Required for GraphQL playground
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    HSTS: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true
    }
  },
  RATE_LIMITER: {
    SKIP_FAILED_REQUESTS: false,
    SKIP_SUCCESSFUL_REQUESTS: false,
    HEADERS: true,
    LEGACY_HEADERS: false,
    DRAFT_POLLI_RRL_SPEC: true
  }
};

/**
 * Environment-specific constants
 */
export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0'
};

/**
 * Error codes and messages
 * Standardized error codes and messages for API responses
 */
export const ERRORS = {
  // General errors
  GENERAL: {
    INTERNAL_SERVER_ERROR: {
      CODE: 'INTERNAL_SERVER_ERROR',
      MESSAGE: 'An unexpected error occurred. Please try again later.'
    },
    NOT_FOUND: {
      CODE: 'RESOURCE_NOT_FOUND',
      MESSAGE: 'The requested resource was not found.'
    },
    BAD_REQUEST: {
      CODE: 'BAD_REQUEST',
      MESSAGE: 'The request was invalid or cannot be processed.'
    },
    UNAUTHORIZED: {
      CODE: 'UNAUTHORIZED',
      MESSAGE: 'Authentication is required to access this resource.'
    },
    FORBIDDEN: {
      CODE: 'FORBIDDEN',
      MESSAGE: 'You do not have permission to access this resource.'
    },
    VALIDATION_ERROR: {
      CODE: 'VALIDATION_ERROR',
      MESSAGE: 'The request data failed validation.'
    },
    SERVICE_UNAVAILABLE: {
      CODE: 'SERVICE_UNAVAILABLE',
      MESSAGE: 'The service is temporarily unavailable. Please try again later.'
    },
    RATE_LIMIT_EXCEEDED: {
      CODE: 'RATE_LIMIT_EXCEEDED',
      MESSAGE: 'Rate limit exceeded. Please try again later.'
    }
  },
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: {
      CODE: 'INVALID_CREDENTIALS',
      MESSAGE: 'Invalid username or password.'
    },
    TOKEN_EXPIRED: {
      CODE: 'TOKEN_EXPIRED',
      MESSAGE: 'Authentication token has expired.'
    },
    INVALID_TOKEN: {
      CODE: 'INVALID_TOKEN',
      MESSAGE: 'Invalid authentication token.'
    },
    ACCOUNT_LOCKED: {
      CODE: 'ACCOUNT_LOCKED',
      MESSAGE: 'Account has been locked due to too many failed login attempts.'
    }
  },
  // Journey-specific errors
  JOURNEY: {
    // Health journey errors
    HEALTH: {
      DEVICE_CONNECTION_FAILED: {
        CODE: 'DEVICE_CONNECTION_FAILED',
        MESSAGE: 'Failed to connect to the health device.'
      },
      METRIC_VALIDATION_FAILED: {
        CODE: 'METRIC_VALIDATION_FAILED',
        MESSAGE: 'Health metric validation failed.'
      },
      FHIR_INTEGRATION_ERROR: {
        CODE: 'FHIR_INTEGRATION_ERROR',
        MESSAGE: 'Error connecting to FHIR system.'
      }
    },
    // Care journey errors
    CARE: {
      APPOINTMENT_CONFLICT: {
        CODE: 'APPOINTMENT_CONFLICT',
        MESSAGE: 'The requested appointment time conflicts with an existing appointment.'
      },
      PROVIDER_UNAVAILABLE: {
        CODE: 'PROVIDER_UNAVAILABLE',
        MESSAGE: 'The selected provider is not available at the requested time.'
      },
      TELEMEDICINE_ERROR: {
        CODE: 'TELEMEDICINE_ERROR',
        MESSAGE: 'Error establishing telemedicine connection.'
      }
    },
    // Plan journey errors
    PLAN: {
      COVERAGE_VERIFICATION_FAILED: {
        CODE: 'COVERAGE_VERIFICATION_FAILED',
        MESSAGE: 'Failed to verify insurance coverage.'
      },
      CLAIM_SUBMISSION_FAILED: {
        CODE: 'CLAIM_SUBMISSION_FAILED',
        MESSAGE: 'Failed to submit insurance claim.'
      },
      PAYMENT_PROCESSING_ERROR: {
        CODE: 'PAYMENT_PROCESSING_ERROR',
        MESSAGE: 'Error processing payment.'
      }
    }
  },
  // Gamification errors
  GAMIFICATION: {
    EVENT_PROCESSING_FAILED: {
      CODE: 'EVENT_PROCESSING_FAILED',
      MESSAGE: 'Failed to process gamification event.'
    },
    ACHIEVEMENT_NOT_FOUND: {
      CODE: 'ACHIEVEMENT_NOT_FOUND',
      MESSAGE: 'The requested achievement was not found.'
    },
    REWARD_REDEMPTION_FAILED: {
      CODE: 'REWARD_REDEMPTION_FAILED',
      MESSAGE: 'Failed to redeem reward.'
    }
  },
  // Notification errors
  NOTIFICATION: {
    DELIVERY_FAILED: {
      CODE: 'NOTIFICATION_DELIVERY_FAILED',
      MESSAGE: 'Failed to deliver notification.'
    },
    TEMPLATE_NOT_FOUND: {
      CODE: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
      MESSAGE: 'Notification template not found.'
    },
    CHANNEL_UNAVAILABLE: {
      CODE: 'NOTIFICATION_CHANNEL_UNAVAILABLE',
      MESSAGE: 'Notification channel is unavailable.'
    }
  }
};

/**
 * API routes configuration
 * Defines the route structure for the API Gateway
 */
export const ROUTES = {
  // API version prefix
  API_PREFIX: '/api',
  // Health check endpoint
  HEALTH: '/health',
  // Documentation endpoints
  DOCS: '/docs',
  SWAGGER: '/swagger',
  // GraphQL endpoint
  GRAPHQL: '/graphql',
  // WebSocket endpoint
  WEBSOCKET: '/ws',
  // Journey-specific routes
  JOURNEY: {
    // Health journey routes
    HEALTH: {
      BASE: '/health',
      METRICS: '/health/metrics',
      GOALS: '/health/goals',
      DEVICES: '/health/devices',
      MEDICAL_HISTORY: '/health/medical-history',
      INSIGHTS: '/health/insights'
    },
    // Care journey routes
    CARE: {
      BASE: '/care',
      APPOINTMENTS: '/care/appointments',
      PROVIDERS: '/care/providers',
      TELEMEDICINE: '/care/telemedicine',
      MEDICATIONS: '/care/medications',
      TREATMENTS: '/care/treatments'
    },
    // Plan journey routes
    PLAN: {
      BASE: '/plan',
      COVERAGE: '/plan/coverage',
      CLAIMS: '/plan/claims',
      BENEFITS: '/plan/benefits',
      PAYMENTS: '/plan/payments',
      DOCUMENTS: '/plan/documents'
    }
  },
  // Authentication routes
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  // Gamification routes
  GAMIFICATION: {
    BASE: '/gamification',
    ACHIEVEMENTS: '/gamification/achievements',
    LEADERBOARD: '/gamification/leaderboard',
    QUESTS: '/gamification/quests',
    REWARDS: '/gamification/rewards',
    PROFILE: '/gamification/profile'
  },
  // Notification routes
  NOTIFICATIONS: {
    BASE: '/notifications',
    SEND: '/notifications/send',
    PREFERENCES: '/notifications/preferences',
    HISTORY: '/notifications/history'
  }
};

/**
 * Feature flags for transitional periods and gradual rollouts
 */
export const FEATURES = {
  ENABLE_GRAPHQL_FEDERATION: process.env.ENABLE_GRAPHQL_FEDERATION === 'true' || false,
  ENABLE_TRACING: process.env.ENABLE_TRACING === 'true' || !ENV.IS_PRODUCTION,
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true' || true,
  ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true' || true,
  ENABLE_RESPONSE_COMPRESSION: process.env.ENABLE_RESPONSE_COMPRESSION === 'true' || ENV.IS_PRODUCTION,
  ENABLE_JOURNEY_CONTEXT: process.env.ENABLE_JOURNEY_CONTEXT === 'true' || true,
  // Breaking changes support features
  BREAKING_CHANGES: {
    ENABLE_COMPATIBILITY_LAYER: process.env.ENABLE_COMPATIBILITY_LAYER === 'true' || true,
    ENABLE_VERSION_NEGOTIATION: process.env.ENABLE_VERSION_NEGOTIATION === 'true' || true,
    ENABLE_DEPRECATION_WARNINGS: process.env.ENABLE_DEPRECATION_WARNINGS === 'true' || true,
    ENABLE_SUNSET_NOTICES: process.env.ENABLE_SUNSET_NOTICES === 'true' || true
  },
  // Journey-specific feature flags
  JOURNEY: {
    HEALTH: {
      ENABLE_FHIR_INTEGRATION: process.env.ENABLE_FHIR_INTEGRATION === 'true' || true,
      ENABLE_WEARABLE_SYNC: process.env.ENABLE_WEARABLE_SYNC === 'true' || true,
      ENABLE_HEALTH_METRICS_AGGREGATION: process.env.ENABLE_HEALTH_METRICS_AGGREGATION === 'true' || true,
      ENABLE_HEALTH_INSIGHTS: process.env.ENABLE_HEALTH_INSIGHTS === 'true' || true,
      ENABLE_MEDICAL_HISTORY: process.env.ENABLE_MEDICAL_HISTORY === 'true' || true
    },
    CARE: {
      ENABLE_TELEMEDICINE: process.env.ENABLE_TELEMEDICINE === 'true' || true,
      ENABLE_PROVIDER_SEARCH: process.env.ENABLE_PROVIDER_SEARCH === 'true' || true,
      ENABLE_APPOINTMENT_SCHEDULING: process.env.ENABLE_APPOINTMENT_SCHEDULING === 'true' || true,
      ENABLE_MEDICATION_TRACKING: process.env.ENABLE_MEDICATION_TRACKING === 'true' || true,
      ENABLE_TREATMENT_PLANS: process.env.ENABLE_TREATMENT_PLANS === 'true' || true
    },
    PLAN: {
      ENABLE_CLAIMS_SUBMISSION: process.env.ENABLE_CLAIMS_SUBMISSION === 'true' || true,
      ENABLE_COVERAGE_CHECK: process.env.ENABLE_COVERAGE_CHECK === 'true' || true,
      ENABLE_BENEFIT_DETAILS: process.env.ENABLE_BENEFIT_DETAILS === 'true' || true,
      ENABLE_PAYMENT_PROCESSING: process.env.ENABLE_PAYMENT_PROCESSING === 'true' || true,
      ENABLE_DOCUMENT_UPLOAD: process.env.ENABLE_DOCUMENT_UPLOAD === 'true' || true
    }
  },
  // Gamification features
  GAMIFICATION: {
    ENABLE_ACHIEVEMENTS: process.env.ENABLE_ACHIEVEMENTS === 'true' || true,
    ENABLE_LEADERBOARDS: process.env.ENABLE_LEADERBOARDS === 'true' || true,
    ENABLE_QUESTS: process.env.ENABLE_QUESTS === 'true' || true,
    ENABLE_REWARDS: process.env.ENABLE_REWARDS === 'true' || true,
    ENABLE_XP_SYSTEM: process.env.ENABLE_XP_SYSTEM === 'true' || true
  }
};
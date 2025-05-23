/**
 * Test fixtures for environment configuration validation across microservices.
 * 
 * These fixtures provide valid and invalid configuration objects for testing
 * proper initialization and configuration validation logic in all backend services,
 * ensuring they fail safely when misconfigured.
 */

// Common types for configuration objects
export interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  ssl?: boolean;
  poolSize?: number;
  maxConnections?: number;
}

export interface ApiConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    windowMs?: number;
    maxRequests?: number;
  };
}

export interface MessagingConfig {
  brokers?: string;
  groupId?: string;
  clientId?: string;
  ssl?: boolean;
  topics?: Record<string, string>;
}

export interface MonitoringConfig {
  enabled?: boolean;
  level?: string;
  format?: string;
  destination?: string;
  filename?: string;
  sentryDsn?: string;
}

/**
 * Database Configuration Fixtures
 */
export const databaseFixtures = {
  // Valid configurations
  valid: {
    postgresql: {
      url: 'postgresql://user:password@localhost:5432/db',
      ssl: false,
      poolSize: 20,
    } as DatabaseConfig,
    
    postgresqlWithHost: {
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
      schema: 'public',
      ssl: false,
      poolSize: 20,
    } as DatabaseConfig,
    
    production: {
      url: 'postgresql://user:password@prod-db.example.com:5432/db',
      ssl: true,
      poolSize: 50,
      maxConnections: 100,
    } as DatabaseConfig,
  },
  
  // Invalid configurations
  invalid: {
    missingRequired: {
      // Missing url or host+username+password+database
      ssl: true,
      poolSize: 20,
    } as DatabaseConfig,
    
    incompleteCredentials: {
      host: 'localhost',
      port: 5432,
      // Missing username
      password: 'password',
      database: 'db',
    } as DatabaseConfig,
    
    invalidPort: {
      url: 'postgresql://user:password@localhost:invalid/db',
    } as DatabaseConfig,
    
    invalidPoolSize: {
      url: 'postgresql://user:password@localhost:5432/db',
      poolSize: -5, // Negative pool size
    } as DatabaseConfig,
    
    conflictingConnection: {
      // Both url and host provided (conflicting)
      url: 'postgresql://user:password@localhost:5432/db',
      host: 'another-host',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
    } as DatabaseConfig,
  },
  
  // Edge cases
  edge: {
    minimalValid: {
      url: 'postgresql://localhost/db',
    } as DatabaseConfig,
    
    extremePoolSize: {
      url: 'postgresql://user:password@localhost:5432/db',
      poolSize: 1000, // Extremely large pool size
    } as DatabaseConfig,
    
    emptyPassword: {
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: '', // Empty password
      database: 'db',
    } as DatabaseConfig,
  },
};

/**
 * API Configuration Fixtures
 */
export const apiFixtures = {
  // Valid configurations
  valid: {
    standard: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      timeout: 5000,
      retries: 3,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 100,
      },
    } as ApiConfig,
    
    minimal: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
    } as ApiConfig,
    
    highPerformance: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      timeout: 10000,
      retries: 5,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 1000,
      },
    } as ApiConfig,
  },
  
  // Invalid configurations
  invalid: {
    missingBaseUrl: {
      apiKey: 'valid-api-key',
      timeout: 5000,
    } as ApiConfig,
    
    missingApiKey: {
      baseUrl: 'https://api.example.com/v1',
      timeout: 5000,
    } as ApiConfig,
    
    invalidUrl: {
      baseUrl: 'not-a-valid-url',
      apiKey: 'valid-api-key',
    } as ApiConfig,
    
    invalidTimeout: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      timeout: -1000, // Negative timeout
    } as ApiConfig,
    
    invalidRetries: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      retries: 10, // Too many retries
    } as ApiConfig,
  },
  
  // Edge cases
  edge: {
    zeroTimeout: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      timeout: 0, // Zero timeout
    } as ApiConfig,
    
    zeroRetries: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      retries: 0, // Zero retries
    } as ApiConfig,
    
    extremeRateLimit: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'valid-api-key',
      rateLimit: {
        windowMs: 1, // Very small window
        maxRequests: 10000, // Very high request limit
      },
    } as ApiConfig,
  },
};

/**
 * Messaging Configuration Fixtures
 */
export const messagingFixtures = {
  // Valid configurations
  valid: {
    kafka: {
      brokers: 'kafka-1:9092,kafka-2:9092,kafka-3:9092',
      groupId: 'test-group',
      clientId: 'test-client',
      ssl: false,
      topics: {
        health: 'health.events',
        care: 'care.events',
        plan: 'plan.events',
      },
    } as MessagingConfig,
    
    minimal: {
      brokers: 'kafka:9092',
      groupId: 'test-group',
    } as MessagingConfig,
    
    production: {
      brokers: 'kafka-prod-1.example.com:9092,kafka-prod-2.example.com:9092',
      groupId: 'prod-group',
      clientId: 'prod-client',
      ssl: true,
      topics: {
        health: 'prod.health.events',
        care: 'prod.care.events',
        plan: 'prod.plan.events',
        user: 'prod.user.events',
        game: 'prod.game.events',
      },
    } as MessagingConfig,
  },
  
  // Invalid configurations
  invalid: {
    missingBrokers: {
      groupId: 'test-group',
      clientId: 'test-client',
    } as MessagingConfig,
    
    invalidBrokers: {
      brokers: '', // Empty brokers string
      groupId: 'test-group',
    } as MessagingConfig,
    
    missingGroupId: {
      brokers: 'kafka:9092',
      // Missing groupId
    } as MessagingConfig,
  },
  
  // Edge cases
  edge: {
    singleBroker: {
      brokers: 'localhost:9092',
      groupId: 'test-group',
    } as MessagingConfig,
    
    manyBrokers: {
      brokers: Array(10).fill('kafka:9092').join(','), // 10 identical brokers
      groupId: 'test-group',
    } as MessagingConfig,
    
    emptyTopics: {
      brokers: 'kafka:9092',
      groupId: 'test-group',
      topics: {}, // Empty topics object
    } as MessagingConfig,
  },
};

/**
 * Monitoring Configuration Fixtures
 */
export const monitoringFixtures = {
  // Valid configurations
  valid: {
    standard: {
      enabled: true,
      level: 'info',
      format: 'json',
      destination: 'stdout',
    } as MonitoringConfig,
    
    file: {
      enabled: true,
      level: 'debug',
      format: 'pretty',
      destination: 'file',
      filename: '/var/log/app.log',
    } as MonitoringConfig,
    
    production: {
      enabled: true,
      level: 'warn',
      format: 'json',
      destination: 'stdout',
      sentryDsn: 'https://example@sentry.io/123',
    } as MonitoringConfig,
  },
  
  // Invalid configurations
  invalid: {
    invalidLevel: {
      enabled: true,
      level: 'trace', // Invalid level
      format: 'json',
    } as MonitoringConfig,
    
    invalidFormat: {
      enabled: true,
      level: 'info',
      format: 'xml', // Invalid format
    } as MonitoringConfig,
    
    missingFilename: {
      enabled: true,
      level: 'info',
      format: 'json',
      destination: 'file',
      // Missing filename when destination is file
    } as MonitoringConfig,
    
    invalidSentryDsn: {
      enabled: true,
      level: 'error',
      sentryDsn: 'not-a-valid-dsn',
    } as MonitoringConfig,
  },
  
  // Edge cases
  edge: {
    disabled: {
      enabled: false,
      // Other fields don't matter when disabled
    } as MonitoringConfig,
    
    minimalValid: {
      level: 'info',
    } as MonitoringConfig,
    
    allOptions: {
      enabled: true,
      level: 'debug',
      format: 'json',
      destination: 'file',
      filename: '/var/log/app.log',
      sentryDsn: 'https://example@sentry.io/123',
    } as MonitoringConfig,
  },
};

/**
 * Service-specific Configuration Fixtures
 */

// Auth Service Configuration Fixtures
export const authServiceFixtures = {
  valid: {
    minimal: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
    },
    complete: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'production',
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_JWT_EXPIRATION: '1h',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      AUTH_REFRESH_TOKEN_EXPIRATION: '7d',
      OAUTH_GOOGLE_CLIENT_ID: 'google-client-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'google-client-secret',
      OAUTH_FACEBOOK_CLIENT_ID: 'facebook-client-id',
      OAUTH_FACEBOOK_CLIENT_SECRET: 'facebook-client-secret',
      OAUTH_APPLE_CLIENT_ID: 'apple-client-id',
      OAUTH_APPLE_CLIENT_SECRET: 'apple-client-secret',
      OAUTH_REDIRECT_URL: 'https://app.austa.com.br/auth/callback',
      MFA_ENABLED: true,
      MFA_ISSUER: 'AUSTA SuperApp',
      MFA_EXPIRY_SECONDS: 300,
      MFA_SMS_PROVIDER: 'twilio',
      MFA_SMS_PROVIDER_API_KEY: 'twilio-api-key',
      PASSWORD_MIN_LENGTH: 10,
      PASSWORD_REQUIRE_UPPERCASE: true,
      PASSWORD_REQUIRE_LOWERCASE: true,
      PASSWORD_REQUIRE_NUMBER: true,
      PASSWORD_REQUIRE_SYMBOL: true,
      PASSWORD_HISTORY_COUNT: 5,
      PASSWORD_MAX_AGE_DAYS: 90,
      ACCOUNT_LOCKOUT_MAX_ATTEMPTS: 5,
      ACCOUNT_LOCKOUT_DURATION_MINUTES: 30,
      ACCOUNT_LOCKOUT_RESET_ATTEMPTS_AFTER_MINUTES: 15,
      BIOMETRIC_AUTHENTICATION_ENABLED: true,
      BIOMETRIC_DEVICE_KEY_EXPIRATION_DAYS: 90,
      SESSION_ABSOLUTE_TIMEOUT_HOURS: 12,
      SESSION_IDLE_TIMEOUT_MINUTES: 30,
      SESSION_MAX_CONCURRENT: 5,
      RATE_LIMIT_LOGIN_MAX: 10,
      RATE_LIMIT_LOGIN_WINDOW_MINUTES: 5,
      RATE_LIMIT_REGISTER_MAX: 5,
      RATE_LIMIT_REGISTER_WINDOW_MINUTES: 60,
      RATE_LIMIT_FORGOT_PASSWORD_MAX: 5,
      RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MINUTES: 60,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'info',
      SENTRY_DSN: 'https://example@sentry.io/auth',
      GDPR_ENABLED: true,
      LGPD_ENABLED: true,
      DATA_RETENTION_DAYS: 730,
      REQUIRE_EMAIL_VERIFICATION: true,
      EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
      REQUIRE_STRONG_PASSWORD: true,
    },
  },
  invalid: {
    missingRequired: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      // Missing AUTH_JWT_SECRET
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      // Missing DATABASE_URL
      REDIS_URL: 'redis://localhost:6379',
    },
    invalidEnvironment: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'invalid-env', // Invalid environment
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
    },
    invalidMfaConfig: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
      MFA_ENABLED: true,
      MFA_SMS_PROVIDER: 'twilio',
      // Missing MFA_SMS_PROVIDER_API_KEY when provider is twilio
    },
  },
  edge: {
    allDefaults: {
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
      // All other values use defaults
    },
    customMfaProvider: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      AUTH_JWT_SECRET: 'jwt-secret',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379',
      MFA_ENABLED: true,
      MFA_SMS_PROVIDER: 'custom', // Custom provider doesn't require API key
    },
  },
};

// Plan Service Configuration Fixtures
export const planServiceFixtures = {
  valid: {
    minimal: {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://user:password@localhost:5432/plan',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
          pathPrefix: 'plan',
        },
      },
      costSimulator: {
        currency: 'BRL',
        procedureCatalog: {
          source: 'database',
          refreshInterval: 86400,
        },
        coverageDefaults: {
          consultations: 80,
          examinations: 70,
          procedures: 60,
          emergencies: 90,
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3000/events',
        timeout: 5000,
        events: {
          claimSubmitted: 'CLAIM_SUBMITTED',
          claimApproved: 'CLAIM_APPROVED',
          digitalCardAccessed: 'DIGITAL_CARD_ACCESSED',
          benefitUsed: 'BENEFIT_USED',
        },
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
        timeout: 5000,
        templates: {
          claimStatus: 'plan-claim-status',
          claimReminder: 'plan-claim-reminder',
          benefitExpiration: 'plan-benefit-expiration',
        },
      },
    },
  },
  invalid: {
    missingServer: {
      // Missing server config
      database: {
        url: 'postgresql://user:password@localhost:5432/plan',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
          pathPrefix: 'plan',
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3000/events',
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
      },
    },
    conflictingDatabaseConfig: {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        // Both url and host provided (conflicting)
        url: 'postgresql://user:password@localhost:5432/plan',
        host: 'db-host',
        port: 5432,
        username: 'user',
        password: 'password',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
          pathPrefix: 'plan',
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3000/events',
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
      },
    },
    missingStorageConfig: {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://user:password@localhost:5432/plan',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 's3',
        // Missing s3 config when provider is s3
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3000/events',
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
      },
    },
  },
  edge: {
    localStorageProvider: {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://user:password@localhost:5432/plan',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 'local',
        local: {
          directory: '/tmp/plan-documents',
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3000/events',
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
      },
    },
    gamificationDisabled: {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://user:password@localhost:5432/plan',
        database: 'plan',
      },
      insuranceApi: {
        baseUrl: 'https://insurance-api.example.com',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10485760,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 2555,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
          pathPrefix: 'plan',
        },
      },
      gamification: {
        enabled: false, // Gamification disabled
        // eventEndpoint not required when disabled
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3000',
      },
    },
  },
};

// Gamification Engine Configuration Fixtures
export const gamificationFixtures = {
  valid: {
    minimal: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
    },
    complete: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'gamification-engine',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      DATABASE_SSL: true,
      DATABASE_MAX_CONNECTIONS: 20,
      REDIS_URL: 'redis://localhost:6379',
      REDIS_PASSWORD: 'redis-password',
      REDIS_TLS: true,
      KAFKA_BROKERS: 'kafka-1:9092,kafka-2:9092',
      KAFKA_GROUP_ID: 'gamification-engine',
      KAFKA_CLIENT_ID: 'gamification-engine',
      KAFKA_SSL: true,
      HEALTH_EVENTS_TOPIC: 'health.events',
      CARE_EVENTS_TOPIC: 'care.events',
      PLAN_EVENTS_TOPIC: 'plan.events',
      USER_EVENTS_TOPIC: 'user.events',
      GAME_EVENTS_TOPIC: 'game.events',
      JWT_SECRET: 'jwt-secret',
      JWT_EXPIRATION: 3600,
      ACHIEVEMENT_NOTIFICATION_ENABLED: true,
      DEFAULT_POINTS_EXPIRY_DAYS: 365,
      EVENT_BATCH_SIZE: 100,
      ENABLE_LEADERBOARDS: true,
      LEADERBOARD_UPDATE_INTERVAL_MS: 60000,
      ACHIEVEMENT_RULES_PATH: './config/rules',
      MAX_ACHIEVEMENTS_PER_USER: 1000,
      POINTS_PRECISION: 2,
      HEALTH_JOURNEY_ENABLED: true,
      CARE_JOURNEY_ENABLED: true,
      PLAN_JOURNEY_ENABLED: true,
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX_REQUESTS: 1000,
      NOTIFICATION_SERVICE_URL: 'http://notification-service:3000',
      ENABLE_METRICS: true,
      METRICS_PORT: 9090,
      SENTRY_DSN: 'https://example@sentry.io/gamification',
      CACHE_TTL: 300,
      ENABLE_QUESTS: true,
      ENABLE_REWARDS: true,
      ENABLE_LEVELS: true,
      EVENT_PROCESSOR_CONCURRENCY: 10,
      RULE_EVALUATION_TIMEOUT_MS: 5000,
      MAX_EVENT_QUEUE_SIZE: 10000,
      ANTI_CHEAT_ENABLED: true,
      MAX_EVENTS_PER_USER_PER_MINUTE: 100,
      MAINTENANCE_MODE: false,
      MAINTENANCE_MESSAGE: 'Gamification system under maintenance',
    },
  },
  invalid: {
    missingRequired: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      // Missing DATABASE_URL
      REDIS_URL: 'redis://localhost:6379',
      // Missing KAFKA_BROKERS
      JWT_SECRET: 'jwt-secret',
    },
    invalidEnvironment: {
      NODE_ENV: 'invalid-env', // Invalid environment
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
    },
    missingNotificationUrl: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
      ACHIEVEMENT_NOTIFICATION_ENABLED: true,
      // Missing NOTIFICATION_SERVICE_URL when notifications are enabled
    },
    invalidBatchSize: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
      EVENT_BATCH_SIZE: 2000, // Exceeds maximum of 1000
    },
  },
  edge: {
    allDefaults: {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
      // All other values use defaults
    },
    notificationsDisabled: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
      ACHIEVEMENT_NOTIFICATION_ENABLED: false,
      // NOTIFICATION_SERVICE_URL not required when notifications disabled
    },
    maintenanceMode: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'kafka:9092',
      JWT_SECRET: 'jwt-secret',
      MAINTENANCE_MODE: true,
      MAINTENANCE_MESSAGE: 'System under scheduled maintenance',
    },
  },
};

/**
 * Environment-specific Configuration Fixtures
 */
export const environmentFixtures = {
  development: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    DATABASE_SSL: false,
    KAFKA_SSL: false,
    REDIS_TLS: false,
  },
  staging: {
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    DATABASE_SSL: true,
    KAFKA_SSL: true,
    REDIS_TLS: true,
  },
  production: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    DATABASE_SSL: true,
    KAFKA_SSL: true,
    REDIS_TLS: true,
  },
  test: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    DATABASE_SSL: false,
    KAFKA_SSL: false,
    REDIS_TLS: false,
  },
};

/**
 * Feature Flag Configuration Fixtures
 */
export const featureFlagFixtures = {
  allEnabled: {
    ENABLE_QUESTS: true,
    ENABLE_REWARDS: true,
    ENABLE_LEVELS: true,
    ENABLE_LEADERBOARDS: true,
    ENABLE_METRICS: true,
    RATE_LIMIT_ENABLED: true,
    ANTI_CHEAT_ENABLED: true,
    MFA_ENABLED: true,
    BIOMETRIC_AUTHENTICATION_ENABLED: true,
    GDPR_ENABLED: true,
    LGPD_ENABLED: true,
    REQUIRE_EMAIL_VERIFICATION: true,
    REQUIRE_STRONG_PASSWORD: true,
  },
  allDisabled: {
    ENABLE_QUESTS: false,
    ENABLE_REWARDS: false,
    ENABLE_LEVELS: false,
    ENABLE_LEADERBOARDS: false,
    ENABLE_METRICS: false,
    RATE_LIMIT_ENABLED: false,
    ANTI_CHEAT_ENABLED: false,
    MFA_ENABLED: false,
    BIOMETRIC_AUTHENTICATION_ENABLED: false,
    GDPR_ENABLED: false,
    LGPD_ENABLED: false,
    REQUIRE_EMAIL_VERIFICATION: false,
    REQUIRE_STRONG_PASSWORD: false,
  },
  mixed: {
    ENABLE_QUESTS: true,
    ENABLE_REWARDS: true,
    ENABLE_LEVELS: false,
    ENABLE_LEADERBOARDS: true,
    ENABLE_METRICS: true,
    RATE_LIMIT_ENABLED: true,
    ANTI_CHEAT_ENABLED: false,
    MFA_ENABLED: true,
    BIOMETRIC_AUTHENTICATION_ENABLED: false,
    GDPR_ENABLED: true,
    LGPD_ENABLED: true,
    REQUIRE_EMAIL_VERIFICATION: false,
    REQUIRE_STRONG_PASSWORD: true,
  },
};

/**
 * Combined Service Configuration Fixtures
 */
export const combinedServiceFixtures = {
  // Valid configurations for all services
  valid: {
    auth: authServiceFixtures.valid.minimal,
    plan: planServiceFixtures.valid.minimal,
    gamification: gamificationFixtures.valid.minimal,
  },
  
  // Invalid configurations for all services
  invalid: {
    auth: authServiceFixtures.invalid.missingRequired,
    plan: planServiceFixtures.invalid.missingServer,
    gamification: gamificationFixtures.invalid.missingRequired,
  },
  
  // Edge case configurations for all services
  edge: {
    auth: authServiceFixtures.edge.allDefaults,
    plan: planServiceFixtures.edge.gamificationDisabled,
    gamification: gamificationFixtures.edge.maintenanceMode,
  },
};
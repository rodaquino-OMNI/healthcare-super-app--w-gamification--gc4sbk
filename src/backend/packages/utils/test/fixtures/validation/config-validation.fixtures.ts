/**
 * Test fixtures for environment configuration validation across microservices.
 * 
 * These fixtures provide valid and invalid configuration objects for testing
 * proper initialization and configuration validation logic in all backend services,
 * ensuring they fail safely when misconfigured.
 */

// Common interfaces for configuration objects
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

export interface AuthConfig {
  jwtSecret?: string;
  jwtExpiration?: string | number;
  refreshTokenSecret?: string;
  refreshTokenExpiration?: string | number;
  mfaEnabled?: boolean;
  mfaIssuer?: string;
  mfaExpirySeconds?: number;
  oauthProviders?: Record<string, any>;
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
  logLevel?: string;
  format?: string;
  destination?: string;
  filename?: string;
  sentryDsn?: string;
  metricsEnabled?: boolean;
  metricsPort?: number;
}

export interface FeatureFlagsConfig {
  [key: string]: boolean;
}

/**
 * Valid configuration fixtures for different service types
 */
export const validConfigurations = {
  /**
   * Valid database configurations for different environments
   */
  database: {
    /**
     * Valid PostgreSQL configuration with URL
     */
    postgresWithUrl: {
      url: 'postgresql://username:password@localhost:5432/database',
      ssl: true,
      poolSize: 20,
    } as DatabaseConfig,

    /**
     * Valid PostgreSQL configuration with individual parameters
     */
    postgresWithParams: {
      host: 'localhost',
      port: 5432,
      username: 'dbuser',
      password: 'dbpassword',
      database: 'austa_health',
      schema: 'health',
      ssl: true,
      poolSize: 10,
    } as DatabaseConfig,

    /**
     * Valid Redis configuration
     */
    redis: {
      url: 'redis://localhost:6379/0',
      password: 'redispassword',
      tls: false,
    },

    /**
     * Minimal valid database configuration
     */
    minimal: {
      url: 'postgresql://username:password@localhost:5432/database',
    } as DatabaseConfig,

    /**
     * Production database configuration
     */
    production: {
      url: 'postgresql://username:password@prod-db.austa.com.br:5432/database',
      ssl: true,
      poolSize: 50,
      maxConnections: 100,
    } as DatabaseConfig,
  },

  /**
   * Valid authentication configurations
   */
  auth: {
    /**
     * Complete JWT configuration
     */
    complete: {
      jwtSecret: 'very-secure-jwt-secret-key-for-testing',
      jwtExpiration: '1h',
      refreshTokenSecret: 'very-secure-refresh-token-secret-key-for-testing',
      refreshTokenExpiration: '7d',
      mfaEnabled: true,
      mfaIssuer: 'AUSTA SuperApp',
      mfaExpirySeconds: 300,
      oauthProviders: {
        google: {
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
          redirectUrl: 'https://app.austa.com.br/auth/google/callback',
        },
        facebook: {
          clientId: 'facebook-client-id',
          clientSecret: 'facebook-client-secret',
          redirectUrl: 'https://app.austa.com.br/auth/facebook/callback',
        },
      },
    } as AuthConfig,

    /**
     * Minimal JWT configuration
     */
    minimal: {
      jwtSecret: 'jwt-secret-key',
      refreshTokenSecret: 'refresh-token-secret-key',
    } as AuthConfig,

    /**
     * JWT configuration with numeric expiration
     */
    numericExpiration: {
      jwtSecret: 'jwt-secret-key',
      jwtExpiration: 3600, // 1 hour in seconds
      refreshTokenSecret: 'refresh-token-secret-key',
      refreshTokenExpiration: 604800, // 7 days in seconds
    } as AuthConfig,
  },

  /**
   * Valid API configurations
   */
  api: {
    /**
     * Complete external API configuration
     */
    complete: {
      baseUrl: 'https://api.external-service.com/v1',
      apiKey: 'external-api-key',
      timeout: 10000,
      retries: 3,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 100,
      },
    } as ApiConfig,

    /**
     * Minimal API configuration
     */
    minimal: {
      baseUrl: 'https://api.external-service.com/v1',
      apiKey: 'external-api-key',
    } as ApiConfig,

    /**
     * Insurance API configuration
     */
    insurance: {
      baseUrl: 'https://api.insurance-provider.com/v2',
      apiKey: 'insurance-api-key',
      timeout: 15000,
      retries: 2,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 50,
      },
    } as ApiConfig,

    /**
     * Healthcare API configuration (FHIR)
     */
    healthcare: {
      baseUrl: 'https://fhir.healthcare-provider.com/r4',
      apiKey: 'healthcare-api-key',
      timeout: 20000,
      retries: 3,
    } as ApiConfig,
  },

  /**
   * Valid messaging configurations
   */
  messaging: {
    /**
     * Complete Kafka configuration
     */
    kafka: {
      brokers: 'kafka-1:9092,kafka-2:9092,kafka-3:9092',
      groupId: 'austa-service',
      clientId: 'austa-service-client',
      ssl: true,
      topics: {
        healthEvents: 'health.events',
        careEvents: 'care.events',
        planEvents: 'plan.events',
        userEvents: 'user.events',
        gameEvents: 'game.events',
      },
    } as MessagingConfig,

    /**
     * Minimal Kafka configuration
     */
    minimal: {
      brokers: 'localhost:9092',
      groupId: 'austa-service',
      clientId: 'austa-service-client',
    } as MessagingConfig,

    /**
     * Development Kafka configuration
     */
    development: {
      brokers: 'localhost:9092',
      groupId: 'austa-service-dev',
      clientId: 'austa-service-client-dev',
      ssl: false,
      topics: {
        healthEvents: 'health.events.dev',
        careEvents: 'care.events.dev',
        planEvents: 'plan.events.dev',
        userEvents: 'user.events.dev',
        gameEvents: 'game.events.dev',
      },
    } as MessagingConfig,
  },

  /**
   * Valid monitoring configurations
   */
  monitoring: {
    /**
     * Complete monitoring configuration
     */
    complete: {
      logLevel: 'info',
      format: 'json',
      destination: 'stdout',
      sentryDsn: 'https://sentry-key@sentry.io/project',
      metricsEnabled: true,
      metricsPort: 9090,
    } as MonitoringConfig,

    /**
     * Minimal monitoring configuration
     */
    minimal: {
      logLevel: 'info',
    } as MonitoringConfig,

    /**
     * File-based logging configuration
     */
    fileLogging: {
      logLevel: 'debug',
      format: 'json',
      destination: 'file',
      filename: '/var/log/austa/service.log',
    } as MonitoringConfig,

    /**
     * Production monitoring configuration
     */
    production: {
      logLevel: 'warn',
      format: 'json',
      destination: 'stdout',
      sentryDsn: 'https://sentry-key@sentry.io/project',
      metricsEnabled: true,
      metricsPort: 9090,
    } as MonitoringConfig,
  },

  /**
   * Valid feature flag configurations
   */
  featureFlags: {
    /**
     * All features enabled
     */
    allEnabled: {
      enableQuests: true,
      enableRewards: true,
      enableLevels: true,
      enableLeaderboards: true,
      enableNotifications: true,
      enableAntiCheat: true,
    } as FeatureFlagsConfig,

    /**
     * Minimal features enabled
     */
    minimal: {
      enableQuests: true,
      enableRewards: false,
      enableLevels: false,
      enableLeaderboards: false,
      enableNotifications: true,
      enableAntiCheat: false,
    } as FeatureFlagsConfig,

    /**
     * Development feature flags
     */
    development: {
      enableQuests: true,
      enableRewards: true,
      enableLevels: true,
      enableLeaderboards: true,
      enableNotifications: true,
      enableAntiCheat: false, // Disabled for easier testing
      enableDebugMode: true, // Development-only flag
    } as FeatureFlagsConfig,
  },

  /**
   * Valid service-specific configurations
   */
  services: {
    /**
     * Valid Auth Service configuration
     */
    authService: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      AUTH_JWT_SECRET: 'very-secure-jwt-secret-key-for-testing',
      AUTH_JWT_EXPIRATION: '1h',
      AUTH_REFRESH_TOKEN_EXPIRATION: '7d',
      AUTH_REFRESH_TOKEN_SECRET: 'very-secure-refresh-token-secret-key-for-testing',
      OAUTH_GOOGLE_CLIENT_ID: 'google-client-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'google-client-secret',
      OAUTH_FACEBOOK_CLIENT_ID: 'facebook-client-id',
      OAUTH_FACEBOOK_CLIENT_SECRET: 'facebook-client-secret',
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
      DATABASE_URL: 'postgresql://username:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379/0',
      LOG_LEVEL: 'info',
    },

    /**
     * Valid Plan Service configuration
     */
    planService: {
      server: {
        port: 3002,
        host: 'localhost',
        cors: {
          origin: ['https://app.austa.com.br', /\.austa\.com\.br$/],
          credentials: true,
        },
        timeout: 30000,
      },
      database: {
        url: 'postgresql://username:password@localhost:5432/plan',
        schema: 'plan',
        ssl: true,
        poolSize: 20,
      },
      insuranceApi: {
        baseUrl: 'https://api.insurance-provider.com/v2',
        apiKey: 'insurance-api-key',
        timeout: 10000,
        retries: 3,
        rateLimit: {
          windowMs: 60000,
          maxRequests: 100,
        },
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10 * 1024 * 1024,
        maxDocumentsPerClaim: 5,
        autoApprovalThreshold: 100,
        processingTimeEstimate: {
          standard: 3,
          express: 1,
        },
        retentionPeriod: 7 * 365,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          accessKeyId: 'aws-access-key',
          secretAccessKey: 'aws-secret-key',
          pathPrefix: 'plan',
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3005/events',
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
        serviceEndpoint: 'http://notification-service:3006/notifications',
        timeout: 5000,
        templates: {
          claimStatus: 'plan-claim-status',
          claimReminder: 'plan-claim-reminder',
          benefitExpiration: 'plan-benefit-expiration',
        },
      },
      logging: {
        level: 'info',
        format: 'json',
        destination: 'stdout',
      },
    },

    /**
     * Valid Gamification Engine configuration
     */
    gamificationEngine: {
      NODE_ENV: 'development',
      PORT: 3005,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'gamification-engine',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/gamification',
      DATABASE_SSL: false,
      DATABASE_MAX_CONNECTIONS: 20,
      REDIS_URL: 'redis://localhost:6379/0',
      REDIS_PASSWORD: 'redispassword',
      REDIS_TLS: false,
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_GROUP_ID: 'gamification-engine',
      KAFKA_CLIENT_ID: 'gamification-engine',
      KAFKA_SSL: false,
      HEALTH_EVENTS_TOPIC: 'health.events',
      CARE_EVENTS_TOPIC: 'care.events',
      PLAN_EVENTS_TOPIC: 'plan.events',
      USER_EVENTS_TOPIC: 'user.events',
      GAME_EVENTS_TOPIC: 'game.events',
      JWT_SECRET: 'jwt-secret-key',
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
      NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
      ENABLE_METRICS: true,
      METRICS_PORT: 9090,
      SENTRY_DSN: 'https://sentry-key@sentry.io/project',
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
};

/**
 * Invalid configuration fixtures for testing error handling
 */
export const invalidConfigurations = {
  /**
   * Invalid database configurations
   */
  database: {
    /**
     * Missing required URL and host parameters
     */
    missingRequired: {
      port: 5432,
      username: 'dbuser',
      password: 'dbpassword',
      database: 'austa_health',
    } as DatabaseConfig,

    /**
     * Invalid port number
     */
    invalidPort: {
      url: 'postgresql://username:password@localhost:70000/database',
    } as DatabaseConfig,

    /**
     * Conflicting parameters (both URL and individual parameters)
     */
    conflictingParams: {
      url: 'postgresql://username:password@localhost:5432/database',
      host: 'another-host',
      port: 5432,
      username: 'another-user',
      password: 'another-password',
      database: 'another-database',
    } as DatabaseConfig,

    /**
     * Invalid connection pool size
     */
    invalidPoolSize: {
      url: 'postgresql://username:password@localhost:5432/database',
      poolSize: -10,
    } as DatabaseConfig,

    /**
     * Missing database name with individual parameters
     */
    missingDatabaseName: {
      host: 'localhost',
      port: 5432,
      username: 'dbuser',
      password: 'dbpassword',
    } as DatabaseConfig,
  },

  /**
   * Invalid authentication configurations
   */
  auth: {
    /**
     * Missing JWT secret
     */
    missingJwtSecret: {
      jwtExpiration: '1h',
      refreshTokenSecret: 'refresh-token-secret-key',
      refreshTokenExpiration: '7d',
    } as AuthConfig,

    /**
     * Missing refresh token secret
     */
    missingRefreshSecret: {
      jwtSecret: 'jwt-secret-key',
      jwtExpiration: '1h',
    } as AuthConfig,

    /**
     * Invalid JWT expiration format
     */
    invalidExpirationFormat: {
      jwtSecret: 'jwt-secret-key',
      jwtExpiration: 'invalid-format',
      refreshTokenSecret: 'refresh-token-secret-key',
      refreshTokenExpiration: '7d',
    } as AuthConfig,

    /**
     * Invalid MFA configuration
     */
    invalidMfaConfig: {
      jwtSecret: 'jwt-secret-key',
      refreshTokenSecret: 'refresh-token-secret-key',
      mfaEnabled: true,
      mfaExpirySeconds: -10, // Negative value
    } as AuthConfig,

    /**
     * Missing SMS provider API key when SMS provider is specified
     */
    missingSmsProviderKey: {
      jwtSecret: 'jwt-secret-key',
      refreshTokenSecret: 'refresh-token-secret-key',
      mfaEnabled: true,
      mfaIssuer: 'AUSTA SuperApp',
      mfaExpirySeconds: 300,
      mfaSmsProvider: 'twilio',
      // Missing mfaSmsProviderApiKey
    },
  },

  /**
   * Invalid API configurations
   */
  api: {
    /**
     * Missing required base URL
     */
    missingBaseUrl: {
      apiKey: 'api-key',
      timeout: 10000,
      retries: 3,
    } as ApiConfig,

    /**
     * Missing required API key
     */
    missingApiKey: {
      baseUrl: 'https://api.external-service.com/v1',
      timeout: 10000,
      retries: 3,
    } as ApiConfig,

    /**
     * Invalid timeout value
     */
    invalidTimeout: {
      baseUrl: 'https://api.external-service.com/v1',
      apiKey: 'api-key',
      timeout: -5000, // Negative timeout
      retries: 3,
    } as ApiConfig,

    /**
     * Invalid retry count
     */
    invalidRetryCount: {
      baseUrl: 'https://api.external-service.com/v1',
      apiKey: 'api-key',
      timeout: 10000,
      retries: 10, // Exceeds maximum allowed retries
    } as ApiConfig,

    /**
     * Invalid rate limit configuration
     */
    invalidRateLimit: {
      baseUrl: 'https://api.external-service.com/v1',
      apiKey: 'api-key',
      rateLimit: {
        windowMs: -60000, // Negative window
        maxRequests: 0, // Zero requests
      },
    } as ApiConfig,
  },

  /**
   * Invalid messaging configurations
   */
  messaging: {
    /**
     * Missing required brokers
     */
    missingBrokers: {
      groupId: 'austa-service',
      clientId: 'austa-service-client',
      ssl: true,
    } as MessagingConfig,

    /**
     * Invalid topic name format
     */
    invalidTopicFormat: {
      brokers: 'kafka-1:9092,kafka-2:9092',
      groupId: 'austa-service',
      clientId: 'austa-service-client',
      topics: {
        healthEvents: 'invalid topic name with spaces',
      },
    } as MessagingConfig,

    /**
     * Empty brokers string
     */
    emptyBrokers: {
      brokers: '',
      groupId: 'austa-service',
      clientId: 'austa-service-client',
    } as MessagingConfig,
  },

  /**
   * Invalid monitoring configurations
   */
  monitoring: {
    /**
     * Invalid log level
     */
    invalidLogLevel: {
      logLevel: 'trace', // Not in allowed values
      format: 'json',
      destination: 'stdout',
    } as MonitoringConfig,

    /**
     * Missing filename for file destination
     */
    missingFilename: {
      logLevel: 'info',
      format: 'json',
      destination: 'file',
      // Missing filename
    } as MonitoringConfig,

    /**
     * Invalid Sentry DSN format
     */
    invalidSentryDsn: {
      logLevel: 'info',
      format: 'json',
      destination: 'stdout',
      sentryDsn: 'invalid-sentry-dsn',
    } as MonitoringConfig,

    /**
     * Invalid metrics port
     */
    invalidMetricsPort: {
      logLevel: 'info',
      metricsEnabled: true,
      metricsPort: 70000, // Port out of range
    } as MonitoringConfig,
  },

  /**
   * Invalid service-specific configurations
   */
  services: {
    /**
     * Invalid Auth Service configuration
     */
    authService: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      // Missing AUTH_JWT_SECRET
      AUTH_JWT_EXPIRATION: '1h',
      // Missing AUTH_REFRESH_TOKEN_SECRET
      AUTH_REFRESH_TOKEN_EXPIRATION: '7d',
      MFA_ENABLED: true,
      MFA_SMS_PROVIDER: 'twilio',
      // Missing MFA_SMS_PROVIDER_API_KEY when MFA_SMS_PROVIDER is specified
      DATABASE_URL: 'postgresql://username:password@localhost:5432/auth',
      // Missing REDIS_URL
    },

    /**
     * Invalid Plan Service configuration
     */
    planService: {
      server: {
        port: 3002,
        host: 'localhost',
        timeout: 30000,
      },
      database: {
        // Missing both url and host
        schema: 'plan',
        ssl: true,
        poolSize: 20,
      },
      insuranceApi: {
        // Missing baseUrl
        apiKey: 'insurance-api-key',
        timeout: 10000,
        retries: 3,
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10 * 1024 * 1024,
        maxDocumentsPerClaim: 5,
      },
      storage: {
        provider: 's3',
        // Missing s3 configuration when provider is s3
      },
      gamification: {
        enabled: true,
        // Missing eventEndpoint
        timeout: 5000,
      },
      notifications: {
        enabled: true,
        // Missing serviceEndpoint
        timeout: 5000,
      },
    },

    /**
     * Invalid Gamification Engine configuration
     */
    gamificationEngine: {
      NODE_ENV: 'development',
      PORT: 3005,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'gamification-engine',
      // Missing DATABASE_URL
      DATABASE_SSL: false,
      DATABASE_MAX_CONNECTIONS: 20,
      // Missing REDIS_URL
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_GROUP_ID: 'gamification-engine',
      KAFKA_CLIENT_ID: 'gamification-engine',
      KAFKA_SSL: false,
      // Missing JWT_SECRET
      JWT_EXPIRATION: 3600,
      ACHIEVEMENT_NOTIFICATION_ENABLED: true,
      // Missing NOTIFICATION_SERVICE_URL when ACHIEVEMENT_NOTIFICATION_ENABLED is true
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
      ENABLE_METRICS: true,
      METRICS_PORT: 9090,
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
    },
  },
};

/**
 * Edge case configuration fixtures
 */
export const edgeCaseConfigurations = {
  /**
   * Minimal valid configurations (only required fields)
   */
  minimal: {
    /**
     * Minimal Auth Service configuration
     */
    authService: {
      AUTH_JWT_SECRET: 'jwt-secret-key',
      AUTH_REFRESH_TOKEN_SECRET: 'refresh-token-secret-key',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/auth',
      REDIS_URL: 'redis://localhost:6379/0',
    },

    /**
     * Minimal Plan Service configuration
     */
    planService: {
      server: {
        port: 3002,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://username:password@localhost:5432/plan',
      },
      insuranceApi: {
        baseUrl: 'https://api.insurance-provider.com/v2',
        apiKey: 'insurance-api-key',
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3005/events',
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3006/notifications',
      },
    },

    /**
     * Minimal Gamification Engine configuration
     */
    gamificationEngine: {
      DATABASE_URL: 'postgresql://username:password@localhost:5432/gamification',
      REDIS_URL: 'redis://localhost:6379/0',
      KAFKA_BROKERS: 'localhost:9092',
      JWT_SECRET: 'jwt-secret-key',
      NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
    },
  },

  /**
   * Partially valid configurations (some valid, some invalid fields)
   */
  partiallyValid: {
    /**
     * Auth Service with some valid and some invalid fields
     */
    authService: {
      PORT: 3000,
      HOST: 'localhost',
      NODE_ENV: 'development',
      AUTH_JWT_SECRET: 'jwt-secret-key',
      AUTH_JWT_EXPIRATION: '1h',
      // Missing AUTH_REFRESH_TOKEN_SECRET (required)
      AUTH_REFRESH_TOKEN_EXPIRATION: '7d',
      MFA_ENABLED: true,
      MFA_ISSUER: 'AUSTA SuperApp',
      MFA_EXPIRY_SECONDS: 300,
      MFA_SMS_PROVIDER: 'twilio',
      MFA_SMS_PROVIDER_API_KEY: 'twilio-api-key',
      DATABASE_URL: 'postgresql://username:password@localhost:5432/auth',
      // Missing REDIS_URL (required)
      LOG_LEVEL: 'info',
    },

    /**
     * Plan Service with some valid and some invalid fields
     */
    planService: {
      server: {
        port: 3002,
        host: 'localhost',
        cors: {
          origin: ['https://app.austa.com.br', /\.austa\.com\.br$/],
          credentials: true,
        },
        timeout: 30000,
      },
      database: {
        // Missing url or host+username+password+database (required)
        schema: 'plan',
        ssl: true,
        poolSize: 20,
      },
      insuranceApi: {
        baseUrl: 'https://api.insurance-provider.com/v2',
        apiKey: 'insurance-api-key',
        timeout: 10000,
        retries: 3,
      },
      claims: {
        supportedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png'],
        maxDocumentSize: 10 * 1024 * 1024,
        maxDocumentsPerClaim: 5,
      },
      storage: {
        provider: 's3',
        s3: {
          bucket: 'austa-plan-documents',
          region: 'sa-east-1',
          // Missing accessKeyId and secretAccessKey (not required if using IAM roles)
        },
      },
      gamification: {
        enabled: true,
        eventEndpoint: 'http://gamification-engine:3005/events',
        timeout: 5000,
      },
      notifications: {
        enabled: true,
        serviceEndpoint: 'http://notification-service:3006/notifications',
        timeout: 5000,
      },
    },
  },

  /**
   * Environment-specific configurations
   */
  environmentSpecific: {
    /**
     * Development environment configuration
     */
    development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      DATABASE_SSL: false,
      KAFKA_SSL: false,
      REDIS_TLS: false,
      ENABLE_DEBUG_MODE: true,
      ANTI_CHEAT_ENABLED: false, // Disabled for easier testing
    },

    /**
     * Production environment configuration
     */
    production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      DATABASE_SSL: true,
      KAFKA_SSL: true,
      REDIS_TLS: true,
      ENABLE_DEBUG_MODE: false,
      ANTI_CHEAT_ENABLED: true,
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX_REQUESTS: 1000,
    },

    /**
     * Testing environment configuration
     */
    testing: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'debug',
      DATABASE_SSL: false,
      KAFKA_SSL: false,
      REDIS_TLS: false,
      ENABLE_DEBUG_MODE: true,
      ANTI_CHEAT_ENABLED: false,
      RATE_LIMIT_ENABLED: false,
    },

    /**
     * Staging environment configuration
     */
    staging: {
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info',
      DATABASE_SSL: true,
      KAFKA_SSL: true,
      REDIS_TLS: true,
      ENABLE_DEBUG_MODE: false,
      ANTI_CHEAT_ENABLED: true,
      RATE_LIMIT_ENABLED: true,
    },
  },

  /**
   * Configurations with conflicting settings
   */
  conflictingSettings: {
    /**
     * Conflicting database configuration (both URL and individual parameters)
     */
    databaseConflict: {
      url: 'postgresql://username:password@localhost:5432/database',
      host: 'another-host',
      port: 5432,
      username: 'another-user',
      password: 'another-password',
      database: 'another-database',
    } as DatabaseConfig,

    /**
     * Conflicting storage provider configuration
     */
    storageProviderConflict: {
      provider: 's3',
      s3: {
        bucket: 'austa-plan-documents',
        region: 'sa-east-1',
      },
      local: {
        directory: '/var/data/documents',
      },
    },

    /**
     * Conflicting feature flags
     */
    featureFlagConflict: {
      enableLeaderboards: true,
      enableLevels: false, // Leaderboards require levels to be enabled
    } as FeatureFlagsConfig,

    /**
     * Conflicting notification settings
     */
    notificationConflict: {
      ACHIEVEMENT_NOTIFICATION_ENABLED: true,
      // Missing NOTIFICATION_SERVICE_URL when notifications are enabled
    },
  },
};
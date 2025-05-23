import { 
  LoggerConfig, 
  FormatterType, 
  TransportType, 
  CloudWatchTransportConfig, 
  FileTransportConfig, 
  ConsoleTransportConfig 
} from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Sample development environment logger configuration with console output.
 * Optimized for local development with colorized, human-readable logs.
 */
export const developmentLoggerConfig: LoggerConfig = {
  serviceName: 'austa-service',
  environment: 'development',
  level: LogLevel.DEBUG,
  defaultFormatter: FormatterType.TEXT,
  timestamp: true,
  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,
  includeMetadata: true,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      enabled: true,
      formatter: FormatterType.TEXT,
      config: {
        colorize: true,
        prettyPrint: true,
        timestamp: true,
        includeStackTrace: true
      } as ConsoleTransportConfig
    },
    {
      type: TransportType.FILE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON,
      config: {
        directory: 'logs',
        filename: 'development-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: 5,
        compress: false,
        createDirectory: true
      } as FileTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'austa-service',
    appName: 'AUSTA SuperApp',
    environment: 'development',
    journey: {
      defaultType: 'HEALTH'
    }
  },
  traceCorrelation: {
    enabled: true,
    generateIfMissing: true,
    traceIdHeader: 'X-Trace-ID',
    spanIdHeader: 'X-Span-ID',
    xrayIntegration: false
  },
  sanitization: {
    enabled: true,
    redactFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    redactionString: '[REDACTED]',
    sanitizeRequests: true,
    sanitizeResponses: false,
    maskPII: true
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Minha Saúde'
      }
    },
    care: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Cuidar-me Agora'
      }
    },
    plan: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Meu Plano & Benefícios'
      }
    }
  },
  bufferSize: 100,
  flushInterval: 1000
};

/**
 * Sample testing environment logger configuration.
 * Optimized for automated tests with minimal output and performance impact.
 */
export const testingLoggerConfig: LoggerConfig = {
  serviceName: 'austa-service',
  environment: 'test',
  level: LogLevel.ERROR, // Only log errors in tests by default
  defaultFormatter: FormatterType.TEXT,
  timestamp: true,
  handleExceptions: false, // Let test framework handle exceptions
  handleRejections: false, // Let test framework handle rejections
  exitOnError: false,
  includeMetadata: false, // Minimize metadata for cleaner test output
  silent: false, // Can be set to true to silence all logs during tests
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.ERROR,
      enabled: true,
      formatter: FormatterType.TEXT,
      config: {
        colorize: true,
        prettyPrint: false,
        timestamp: true,
        includeStackTrace: true
      } as ConsoleTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'austa-service',
    appName: 'AUSTA SuperApp',
    environment: 'test'
  },
  traceCorrelation: {
    enabled: true,
    generateIfMissing: true
  },
  sanitization: {
    enabled: false // Disable sanitization in tests for easier debugging
  },
  bufferSize: 10, // Smaller buffer for tests
  flushInterval: 100 // Faster flush for tests
};

/**
 * Sample production environment logger configuration with structured JSON and CloudWatch integration.
 * Optimized for cloud deployment with comprehensive logging and monitoring.
 */
export const productionLoggerConfig: LoggerConfig = {
  serviceName: 'austa-service',
  environment: 'production',
  level: LogLevel.INFO,
  defaultFormatter: FormatterType.JSON,
  timestamp: true,
  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,
  includeMetadata: true,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON,
      config: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
        includeStackTrace: false
      } as ConsoleTransportConfig
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'austa-service-prod',
        retentionDays: 30,
        batchSize: 10000,
        flushInterval: 1000,
        maxRetries: 3,
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'austa-service',
    appName: 'AUSTA SuperApp',
    environment: 'production',
    version: process.env.APP_VERSION || 'unknown',
    journey: {
      defaultType: 'HEALTH'
    }
  },
  traceCorrelation: {
    enabled: true,
    generateIfMissing: true,
    traceIdHeader: 'X-Trace-ID',
    spanIdHeader: 'X-Span-ID',
    xrayIntegration: true // Enable X-Ray integration in production
  },
  sanitization: {
    enabled: true,
    redactFields: [
      'password', 'token', 'secret', 'authorization', 'apiKey',
      'creditCard', 'ssn', 'socialSecurityNumber', 'cpf', 'rg'
    ],
    redactionString: '[REDACTED]',
    sanitizeRequests: true,
    sanitizeResponses: true,
    maskPII: true
  },
  journeys: {
    health: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Minha Saúde',
        journeyVersion: '1.0'
      }
    },
    care: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Cuidar-me Agora',
        journeyVersion: '1.0'
      }
    },
    plan: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Meu Plano & Benefícios',
        journeyVersion: '1.0'
      }
    }
  },
  bufferSize: 1000,
  flushInterval: 5000 // Longer flush interval for production to reduce API calls
};

/**
 * Sample staging environment logger configuration.
 * Balances between development and production settings.
 */
export const stagingLoggerConfig: LoggerConfig = {
  ...productionLoggerConfig,
  environment: 'staging',
  level: LogLevel.DEBUG, // More verbose logging in staging
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      enabled: true,
      formatter: FormatterType.JSON,
      config: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
        includeStackTrace: true
      } as ConsoleTransportConfig
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'austa-service-staging',
        retentionDays: 14, // Shorter retention for staging
        batchSize: 5000,
        flushInterval: 2000,
        maxRetries: 3,
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  contextDefaults: {
    ...productionLoggerConfig.contextDefaults,
    environment: 'staging'
  }
};

/**
 * Journey-specific logger configuration for the Health journey.
 * Includes specialized settings for health metrics and device integrations.
 */
export const healthJourneyLoggerConfig: LoggerConfig = {
  ...productionLoggerConfig,
  serviceName: 'health-service',
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'health-journey-prod',
        retentionDays: 30,
        batchSize: 10000,
        flushInterval: 1000,
        maxRetries: 3,
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'health-service',
    appName: 'AUSTA SuperApp',
    environment: 'production',
    journey: {
      defaultType: 'HEALTH'
    },
    healthMetrics: {
      enabled: true,
      syncInterval: 3600 // seconds
    }
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG, // More detailed logging for the primary journey
      context: {
        journeyName: 'Minha Saúde',
        journeyVersion: '1.0',
        metrics: ['steps', 'heartRate', 'sleep', 'weight', 'bloodPressure'],
        devices: ['fitbit', 'garmin', 'apple', 'samsung']
      }
    }
  }
};

/**
 * Journey-specific logger configuration for the Care journey.
 * Includes specialized settings for appointments and telemedicine.
 */
export const careJourneyLoggerConfig: LoggerConfig = {
  ...productionLoggerConfig,
  serviceName: 'care-service',
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'care-journey-prod',
        retentionDays: 30,
        batchSize: 10000,
        flushInterval: 1000,
        maxRetries: 3,
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'care-service',
    appName: 'AUSTA SuperApp',
    environment: 'production',
    journey: {
      defaultType: 'CARE'
    },
    telemedicine: {
      enabled: true,
      provider: 'default-provider'
    }
  },
  journeys: {
    care: {
      level: LogLevel.DEBUG, // More detailed logging for the primary journey
      context: {
        journeyName: 'Cuidar-me Agora',
        journeyVersion: '1.0',
        features: ['appointments', 'telemedicine', 'medications', 'providers']
      }
    }
  }
};

/**
 * Journey-specific logger configuration for the Plan journey.
 * Includes specialized settings for insurance plans and claims.
 */
export const planJourneyLoggerConfig: LoggerConfig = {
  ...productionLoggerConfig,
  serviceName: 'plan-service',
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'plan-journey-prod',
        retentionDays: 30,
        batchSize: 10000,
        flushInterval: 1000,
        maxRetries: 3,
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  contextDefaults: {
    serviceName: 'plan-service',
    appName: 'AUSTA SuperApp',
    environment: 'production',
    journey: {
      defaultType: 'PLAN'
    },
    claims: {
      enabled: true,
      processingTimeout: 86400 // seconds (24 hours)
    }
  },
  journeys: {
    plan: {
      level: LogLevel.DEBUG, // More detailed logging for the primary journey
      context: {
        journeyName: 'Meu Plano & Benefícios',
        journeyVersion: '1.0',
        features: ['plans', 'benefits', 'claims', 'coverage', 'documents']
      }
    }
  }
};

/**
 * Special test configuration with minimal settings.
 * Used for testing the logger's default value handling.
 */
export const minimalLoggerConfig: LoggerConfig = {
  serviceName: 'minimal-service',
  environment: 'test'
};

/**
 * Special test configuration with all transports disabled.
 * Used for testing silent mode and transport enabling/disabling.
 */
export const silentLoggerConfig: LoggerConfig = {
  serviceName: 'silent-service',
  environment: 'test',
  silent: true,
  transports: [
    {
      type: TransportType.CONSOLE,
      enabled: false
    },
    {
      type: TransportType.FILE,
      enabled: false
    },
    {
      type: TransportType.CLOUDWATCH,
      enabled: false
    }
  ]
};

/**
 * Special test configuration with invalid settings.
 * Used for testing error handling and validation.
 */
export const invalidLoggerConfig: LoggerConfig = {
  serviceName: 'invalid-service',
  environment: 'test',
  level: 999 as unknown as LogLevel, // Invalid log level
  transports: [
    {
      type: 'invalid' as TransportType, // Invalid transport type
      enabled: true
    }
  ],
  defaultFormatter: 'invalid' as FormatterType // Invalid formatter type
};

/**
 * Special test configuration with high performance settings.
 * Used for testing high-throughput logging scenarios.
 */
export const highPerformanceLoggerConfig: LoggerConfig = {
  serviceName: 'high-performance-service',
  environment: 'production',
  level: LogLevel.INFO,
  defaultFormatter: FormatterType.JSON,
  timestamp: true,
  handleExceptions: true,
  handleRejections: true,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.WARN, // Only log warnings and above to console
      enabled: true,
      formatter: FormatterType.JSON,
      config: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
        includeStackTrace: false
      } as ConsoleTransportConfig
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.CLOUDWATCH,
      config: {
        region: 'us-east-1',
        logGroupName: 'austa-superapp',
        logStreamName: 'high-performance-prod',
        retentionDays: 7, // Shorter retention for high-volume logs
        batchSize: 20000, // Larger batch size
        flushInterval: 10000, // Longer flush interval
        maxRetries: 2, // Fewer retries
        createLogGroup: true
      } as CloudWatchTransportConfig
    }
  ],
  bufferSize: 5000, // Larger buffer
  flushInterval: 10000 // Longer flush interval
};

/**
 * Special test configuration for local development without internet access.
 * Used for testing offline development scenarios.
 */
export const offlineLoggerConfig: LoggerConfig = {
  serviceName: 'offline-service',
  environment: 'development',
  level: LogLevel.DEBUG,
  defaultFormatter: FormatterType.TEXT,
  timestamp: true,
  handleExceptions: true,
  handleRejections: true,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      enabled: true,
      formatter: FormatterType.TEXT,
      config: {
        colorize: true,
        prettyPrint: true,
        timestamp: true,
        includeStackTrace: true
      } as ConsoleTransportConfig
    },
    {
      type: TransportType.FILE,
      level: LogLevel.INFO,
      enabled: true,
      formatter: FormatterType.JSON,
      config: {
        directory: 'logs',
        filename: 'offline-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: 10,
        compress: true,
        createDirectory: true
      } as FileTransportConfig
    }
  ],
  // No CloudWatch transport for offline development
  contextDefaults: {
    serviceName: 'offline-service',
    appName: 'AUSTA SuperApp',
    environment: 'development',
    offlineMode: true
  }
};

/**
 * Collection of all sample logger configurations for easy export.
 */
export const loggerConfigs = {
  development: developmentLoggerConfig,
  testing: testingLoggerConfig,
  staging: stagingLoggerConfig,
  production: productionLoggerConfig,
  health: healthJourneyLoggerConfig,
  care: careJourneyLoggerConfig,
  plan: planJourneyLoggerConfig,
  minimal: minimalLoggerConfig,
  silent: silentLoggerConfig,
  invalid: invalidLoggerConfig,
  highPerformance: highPerformanceLoggerConfig,
  offline: offlineLoggerConfig
};
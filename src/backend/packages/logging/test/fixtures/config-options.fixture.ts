/**
 * @file config-options.fixture.ts
 * @description Test fixtures for logger configuration options.
 * Provides sample configurations for different environments and scenarios
 * to test the LoggerModule's configuration handling.
 */

import { 
  LoggerConfig, 
  FormatterType, 
  TransportType,
  LogContextDefaults,
  TransportConfig,
  JourneyLogConfig
} from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Basic development configuration with console output and text formatter
 */
export const developmentConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  formatter: FormatterType.TEXT,
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: true,
        prettyPrint: true,
        timestamp: true
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'test-service',
    environment: 'development',
    version: '1.0.0'
  },
  enableTracing: true,
  redactSensitiveData: true,
  sensitiveFields: ['password', 'token', 'secret', 'authorization', 'cookie'],
  maxObjectDepth: 5,
  handleExceptions: true,
  exitOnError: false,
  silent: false
};

/**
 * Production configuration with console and CloudWatch transports
 */
export const productionConfig: LoggerConfig = {
  level: LogLevel.INFO,
  formatter: FormatterType.JSON,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      formatter: FormatterType.JSON,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: true
      }
    },
    {
      type: TransportType.CLOUDWATCH,
      level: LogLevel.INFO,
      formatter: FormatterType.CLOUDWATCH,
      cloudWatch: {
        region: 'us-east-1',
        logGroupName: '/austa-superapp/production',
        logStreamName: 'test-service',
        retries: 3,
        batchSize: 10000,
        flushInterval: 1000
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'test-service',
    environment: 'production',
    version: '1.0.0',
    additional: {
      deploymentId: 'prod-deployment-123',
      instanceId: 'i-1234567890abcdef0'
    }
  },
  enableTracing: true,
  redactSensitiveData: true,
  sensitiveFields: ['password', 'token', 'secret', 'authorization', 'cookie', 'ssn', 'creditCard'],
  maxObjectDepth: 3,
  handleExceptions: true,
  exitOnError: true,
  silent: false
};

/**
 * Testing configuration with minimal console output
 */
export const testingConfig: LoggerConfig = {
  level: LogLevel.ERROR,
  formatter: FormatterType.TEXT,
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: false
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'test-service',
    environment: 'test',
    version: '1.0.0'
  },
  enableTracing: false,
  redactSensitiveData: true,
  handleExceptions: false,
  exitOnError: false,
  silent: true
};

/**
 * File-based logging configuration for local development
 */
export const fileLoggingConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  formatter: FormatterType.JSON,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      formatter: FormatterType.TEXT
    },
    {
      type: TransportType.FILE,
      level: LogLevel.DEBUG,
      formatter: FormatterType.JSON,
      file: {
        filename: './logs/austa-superapp.log',
        maxSize: 10485760, // 10MB
        maxFiles: 5,
        compress: true,
        append: true
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'test-service',
    environment: 'development',
    version: '1.0.0'
  },
  enableTracing: true,
  redactSensitiveData: true,
  handleExceptions: true,
  exitOnError: false
};

/**
 * Journey-specific logging configurations
 */
export const journeySpecificConfig: LoggerConfig = {
  level: LogLevel.INFO,
  formatter: FormatterType.JSON,
  transports: [
    {
      type: TransportType.CONSOLE,
      formatter: FormatterType.TEXT
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'journey-service',
    environment: 'development',
    version: '1.0.0'
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      context: {
        journeyId: 'health',
        journeyVersion: '2.0.0',
        features: ['metrics', 'goals', 'devices']
      },
      transports: [
        {
          type: TransportType.FILE,
          formatter: FormatterType.JSON,
          file: {
            filename: './logs/health-journey.log',
            maxSize: 5242880, // 5MB
            maxFiles: 3,
            compress: true
          }
        }
      ]
    },
    care: {
      level: LogLevel.INFO,
      context: {
        journeyId: 'care',
        journeyVersion: '1.5.0',
        features: ['appointments', 'telemedicine', 'medications']
      }
    },
    plan: {
      level: LogLevel.WARN,
      context: {
        journeyId: 'plan',
        journeyVersion: '1.2.0',
        features: ['claims', 'benefits', 'coverage']
      }
    }
  },
  enableTracing: true,
  redactSensitiveData: true,
  handleExceptions: true,
  exitOnError: false
};

/**
 * Minimal configuration to test defaults
 */
export const minimalConfig: LoggerConfig = {
  level: LogLevel.INFO
};

/**
 * Configuration with multiple transports of the same type
 */
export const multipleTransportsConfig: LoggerConfig = {
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      formatter: FormatterType.TEXT,
      console: {
        colorize: true
      }
    },
    {
      type: TransportType.CONSOLE,
      level: LogLevel.ERROR,
      formatter: FormatterType.JSON,
      console: {
        colorize: false
      }
    },
    {
      type: TransportType.FILE,
      level: LogLevel.INFO,
      file: {
        filename: './logs/info.log'
      }
    },
    {
      type: TransportType.FILE,
      level: LogLevel.ERROR,
      file: {
        filename: './logs/error.log'
      }
    }
  ]
};

/**
 * Configuration with invalid formatter (for testing error handling)
 */
export const invalidFormatterConfig: LoggerConfig = {
  level: LogLevel.INFO,
  // @ts-ignore - Intentionally using an invalid formatter for testing
  formatter: 'invalid-formatter',
  transports: [
    {
      type: TransportType.CONSOLE
    }
  ]
};

/**
 * Configuration with invalid transport type (for testing error handling)
 */
export const invalidTransportConfig: LoggerConfig = {
  level: LogLevel.INFO,
  transports: [
    {
      // @ts-ignore - Intentionally using an invalid transport for testing
      type: 'invalid-transport'
    }
  ]
};

/**
 * Configuration with missing required transport config (for testing error handling)
 */
export const missingRequiredTransportConfig: LoggerConfig = {
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.FILE,
      // Missing required file.filename property
      file: {
        maxSize: 1048576
      } as any
    }
  ]
};

/**
 * Configuration with CloudWatch transport but missing region (for testing error handling)
 */
export const missingCloudWatchRegionConfig: LoggerConfig = {
  level: LogLevel.INFO,
  transports: [
    {
      type: TransportType.CLOUDWATCH,
      cloudWatch: {
        // Missing required region
        logGroupName: '/austa-superapp/test'
      } as any
    }
  ]
};

/**
 * Configuration with empty transports array (for testing error handling)
 */
export const emptyTransportsConfig: LoggerConfig = {
  level: LogLevel.INFO,
  transports: []
};

/**
 * Configuration with all log levels for testing level filtering
 */
export const allLogLevelsConfig: LoggerConfig = {
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      console: { colorize: true }
    },
    {
      type: TransportType.CONSOLE,
      level: LogLevel.INFO,
      console: { colorize: true }
    },
    {
      type: TransportType.CONSOLE,
      level: LogLevel.WARN,
      console: { colorize: true }
    },
    {
      type: TransportType.CONSOLE,
      level: LogLevel.ERROR,
      console: { colorize: true }
    },
    {
      type: TransportType.CONSOLE,
      level: LogLevel.FATAL,
      console: { colorize: true }
    }
  ]
};

/**
 * Configuration with all formatter types for testing formatter selection
 */
export const allFormattersConfig: LoggerConfig = {
  transports: [
    {
      type: TransportType.CONSOLE,
      formatter: FormatterType.TEXT
    },
    {
      type: TransportType.CONSOLE,
      formatter: FormatterType.JSON
    },
    {
      type: TransportType.CONSOLE,
      formatter: FormatterType.CLOUDWATCH
    }
  ]
};

/**
 * Configuration for AWS Lambda environment
 */
export const lambdaConfig: LoggerConfig = {
  level: LogLevel.INFO,
  formatter: FormatterType.JSON,
  transports: [
    {
      type: TransportType.CONSOLE,
      formatter: FormatterType.JSON,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: true
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'lambda-function',
    environment: 'production',
    version: '1.0.0',
    additional: {
      awsRegion: 'us-east-1',
      functionName: 'austa-api-handler',
      functionVersion: '$LATEST'
    }
  },
  enableTracing: true,
  redactSensitiveData: true,
  handleExceptions: true,
  exitOnError: false // Lambda should not exit on error
};

/**
 * Configuration for local development with all features enabled
 */
export const fullFeaturedDevConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  formatter: FormatterType.TEXT,
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.DEBUG,
      formatter: FormatterType.TEXT,
      console: {
        colorize: true,
        prettyPrint: true,
        timestamp: true
      }
    },
    {
      type: TransportType.FILE,
      level: LogLevel.INFO,
      formatter: FormatterType.JSON,
      file: {
        filename: './logs/combined.log',
        maxSize: 10485760,
        maxFiles: 5,
        compress: true
      }
    },
    {
      type: TransportType.FILE,
      level: LogLevel.ERROR,
      formatter: FormatterType.JSON,
      file: {
        filename: './logs/error.log',
        maxSize: 10485760,
        maxFiles: 10,
        compress: true
      }
    }
  ],
  context: {
    application: 'austa-superapp',
    service: 'dev-service',
    environment: 'development',
    version: '1.0.0',
    additional: {
      developer: 'John Doe',
      machine: 'local-dev-machine',
      features: ['all']
    }
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      context: {
        journeyId: 'health',
        features: ['all']
      }
    },
    care: {
      level: LogLevel.DEBUG,
      context: {
        journeyId: 'care',
        features: ['all']
      }
    },
    plan: {
      level: LogLevel.DEBUG,
      context: {
        journeyId: 'plan',
        features: ['all']
      }
    }
  },
  enableTracing: true,
  redactSensitiveData: true,
  sensitiveFields: [
    'password', 'token', 'secret', 'authorization', 'cookie',
    'ssn', 'creditCard', 'accessKey', 'privateKey'
  ],
  maxObjectDepth: 10,
  handleExceptions: true,
  exitOnError: false,
  silent: false
};
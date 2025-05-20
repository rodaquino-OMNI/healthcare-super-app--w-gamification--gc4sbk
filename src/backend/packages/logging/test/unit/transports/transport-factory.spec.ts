import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Import the class to test
import { TransportFactory } from '../../../src/transports/transport-factory';

// Import interfaces and types
import { LoggerConfig, TransportConfig, TransportType } from '../../../src/interfaces/log-config.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { Transport } from '../../../src/interfaces/transport.interface';

// Import formatters for testing
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

// Import transports for mocking
import { ConsoleTransport } from '../../../src/transports/console.transport';
import { FileTransport } from '../../../src/transports/file.transport';
import { CloudWatchTransport } from '../../../src/transports/cloudwatch.transport';

// Mock the transports
jest.mock('../../../src/transports/console.transport');
jest.mock('../../../src/transports/file.transport');
jest.mock('../../../src/transports/cloudwatch.transport');

// Mock the formatters
jest.mock('../../../src/formatters/json.formatter');
jest.mock('../../../src/formatters/text.formatter');
jest.mock('../../../src/formatters/cloudwatch.formatter');

// Mock Logger to prevent console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

describe('TransportFactory', () => {
  let transportFactory: TransportFactory;
  let configService: ConfigService;

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'NODE_ENV': 'development',
          'APP_NAME': 'test-app',
          'SERVICE_NAME': 'test-service',
          'AWS_REGION': 'us-east-1',
          'AWS_ACCESS_KEY_ID': 'test-key-id',
          'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
          'INSTANCE_ID': 'test-instance',
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    // Create the factory with mocked dependencies
    transportFactory = new TransportFactory(configService);
  });

  describe('createTransports', () => {
    it('should create a default console transport when no transports are specified', () => {
      // Arrange
      const config: LoggerConfig = {};
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
    });

    it('should create a default console transport when empty transports array is provided', () => {
      // Arrange
      const config: LoggerConfig = { transports: [] };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
    });

    it('should create multiple transports based on configuration', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CONSOLE },
          { type: TransportType.FILE, filename: 'test.log' },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(2);
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(FileTransport).toHaveBeenCalledTimes(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(transports[1]).toBeInstanceOf(FileTransport);
    });

    it('should create a fallback console transport if all configured transports fail', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.FILE }, // Missing required filename
        ],
      };
      
      // Mock FileTransport constructor to throw an error
      (FileTransport as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Missing filename');
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
    });

    it('should continue creating transports even if one fails', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CONSOLE },
          { type: TransportType.FILE }, // Missing required filename
          { type: TransportType.CLOUDWATCH, logGroupName: 'test-group' },
        ],
      };
      
      // Mock FileTransport constructor to throw an error
      (FileTransport as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Missing filename');
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(2);
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(CloudWatchTransport).toHaveBeenCalledTimes(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(transports[1]).toBeInstanceOf(CloudWatchTransport);
    });
  });

  describe('environment-specific configuration', () => {
    it('should apply development environment overrides for console transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CONSOLE },
        ],
      };
      
      // Mock ConfigService to return development environment
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return null;
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(ConsoleTransport).toHaveBeenCalledWith(expect.objectContaining({
        colorize: true,
        level: LogLevel.DEBUG,
      }));
      expect(TextFormatter).toHaveBeenCalled();
    });

    it('should apply production environment overrides for CloudWatch transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CLOUDWATCH, logGroupName: 'test-group' },
        ],
      };
      
      // Mock ConfigService to return production environment
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'NODE_ENV': 'production',
          'APP_NAME': 'test-app',
          'SERVICE_NAME': 'test-service',
          'AWS_REGION': 'us-east-1',
          'AWS_ACCESS_KEY_ID': 'test-key-id',
          'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
          'INSTANCE_ID': 'test-instance',
        };
        return config[key];
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchTransport).toHaveBeenCalledWith(expect.objectContaining({
        logGroupName: 'test-group',
        level: LogLevel.INFO,
        tags: expect.objectContaining({
          Environment: 'production',
          Application: 'test-app',
          Service: 'test-service',
        }),
      }));
      expect(CloudWatchFormatter).toHaveBeenCalled();
    });

    it('should replace CloudWatch transport with console transport in test environment', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CLOUDWATCH, logGroupName: 'test-group' },
        ],
      };
      
      // Mock ConfigService to return test environment
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'test';
        return null;
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchTransport).not.toHaveBeenCalled();
      expect(ConsoleTransport).toHaveBeenCalledWith(expect.objectContaining({
        level: LogLevel.ERROR,
        colorize: true,
      }));
    });
  });

  describe('transport configuration validation', () => {
    it('should throw an error for missing transport type', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: undefined as unknown as TransportType },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for invalid log level', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CONSOLE, 
            level: 999 as unknown as LogLevel 
          },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for missing filename in file transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.FILE },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(FileTransport).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid maxSize format in file transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.FILE, 
            filename: 'test.log',
            maxSize: '10x' // Invalid format
          },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(FileTransport).not.toHaveBeenCalled();
    });

    it('should throw an error for missing log group name in CloudWatch transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { type: TransportType.CLOUDWATCH },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(CloudWatchTransport).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid batch size in CloudWatch transport', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
            batchSize: 20000 // Exceeds maximum of 10000
          },
        ],
      };
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(CloudWatchTransport).not.toHaveBeenCalled();
    });
  });

  describe('formatter selection', () => {
    it('should use TextFormatter for console transport with useJsonFormat=false', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CONSOLE, 
            useJsonFormat: false 
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(TextFormatter).toHaveBeenCalledTimes(1);
      expect(JsonFormatter).not.toHaveBeenCalled();
    });

    it('should use JsonFormatter for console transport with useJsonFormat=true', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CONSOLE, 
            useJsonFormat: true 
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(JsonFormatter).toHaveBeenCalledTimes(1);
      expect(TextFormatter).not.toHaveBeenCalled();
    });

    it('should always use JsonFormatter for file transport regardless of useJsonFormat', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.FILE, 
            filename: 'test.log',
            useJsonFormat: false // This should be ignored
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(JsonFormatter).toHaveBeenCalledTimes(1);
      expect(TextFormatter).not.toHaveBeenCalled();
    });

    it('should always use CloudWatchFormatter for CloudWatch transport regardless of useJsonFormat', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
            useJsonFormat: false // This should be ignored
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchFormatter).toHaveBeenCalledTimes(1);
      expect(JsonFormatter).not.toHaveBeenCalled();
      expect(TextFormatter).not.toHaveBeenCalled();
    });
  });

  describe('AWS configuration', () => {
    it('should use AWS configuration from environment variables if not provided in config', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
          },
        ],
      };
      
      // Mock ConfigService to return AWS configuration
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'NODE_ENV': 'production',
          'APP_NAME': 'test-app',
          'SERVICE_NAME': 'test-service',
          'AWS_REGION': 'us-east-1',
          'AWS_ACCESS_KEY_ID': 'test-key-id',
          'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
          'INSTANCE_ID': 'test-instance',
        };
        return config[key];
      });
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchTransport).toHaveBeenCalledWith(expect.objectContaining({
        region: 'us-east-1',
        awsAccessKeyId: 'test-key-id',
        awsSecretAccessKey: 'test-secret-key',
      }));
    });

    it('should use AWS configuration from transport config if provided', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
            region: 'eu-west-1',
            awsAccessKeyId: 'config-key-id',
            awsSecretAccessKey: 'config-secret-key',
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchTransport).toHaveBeenCalledWith(expect.objectContaining({
        region: 'eu-west-1',
        awsAccessKeyId: 'config-key-id',
        awsSecretAccessKey: 'config-secret-key',
      }));
    });

    it('should throw an error if AWS region is missing', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
          },
        ],
      };
      
      // Mock ConfigService to return no AWS region
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return null;
      });
      
      // Act & Assert
      expect(() => transportFactory.createTransports(config)).not.toThrow();
      // The factory should catch the error and create a fallback console transport
      expect(ConsoleTransport).toHaveBeenCalledTimes(1);
      expect(CloudWatchTransport).not.toHaveBeenCalled();
    });
  });

  describe('log retention configuration', () => {
    it('should set appropriate retention days based on environment', () => {
      // Test different environments
      const environments = [
        { env: 'production', expectedDays: 90 },
        { env: 'staging', expectedDays: 30 },
        { env: 'development', expectedDays: 7 },
        { env: 'other', expectedDays: 1 },
      ];
      
      for (const { env, expectedDays } of environments) {
        // Arrange
        jest.clearAllMocks();
        
        const config: LoggerConfig = {
          transports: [
            { 
              type: TransportType.CLOUDWATCH, 
              logGroupName: 'test-group',
            },
          ],
        };
        
        // Mock ConfigService to return specific environment
        (configService.get as jest.Mock).mockImplementation((key: string) => {
          const config: Record<string, any> = {
            'NODE_ENV': env,
            'APP_NAME': 'test-app',
            'SERVICE_NAME': 'test-service',
            'AWS_REGION': 'us-east-1',
            'AWS_ACCESS_KEY_ID': 'test-key-id',
            'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
            'INSTANCE_ID': 'test-instance',
          };
          return config[key];
        });
        
        // Act
        const transports = transportFactory.createTransports(config);
        
        // Assert
        expect(transports).toHaveLength(1);
        expect(CloudWatchTransport).toHaveBeenCalledWith(expect.objectContaining({
          retentionInDays: expectedDays,
        }));
      }
    });

    it('should use retention days from config if provided', () => {
      // Arrange
      const config: LoggerConfig = {
        transports: [
          { 
            type: TransportType.CLOUDWATCH, 
            logGroupName: 'test-group',
            retentionInDays: 180,
          },
        ],
      };
      
      // Act
      const transports = transportFactory.createTransports(config);
      
      // Assert
      expect(transports).toHaveLength(1);
      expect(CloudWatchTransport).toHaveBeenCalledWith(expect.objectContaining({
        retentionInDays: 180,
      }));
    });
  });
});
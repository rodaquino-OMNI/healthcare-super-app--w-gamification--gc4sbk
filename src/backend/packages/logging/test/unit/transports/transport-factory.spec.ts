import { Test } from '@nestjs/testing';
import { TransportFactory } from '../../../src/transports/transport-factory';
import { ConsoleTransport } from '../../../src/transports/console.transport';
import { FileTransport } from '../../../src/transports/file.transport';
import { CloudWatchTransport } from '../../../src/transports/cloudwatch.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { JSONFormatter } from '../../../src/formatters/json.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

/**
 * Unit tests for the TransportFactory
 * 
 * These tests verify the TransportFactory's ability to create and configure
 * appropriate transport instances based on application configuration.
 */
describe('TransportFactory', () => {
  let transportFactory: TransportFactory;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TransportFactory],
    }).compile();

    transportFactory = moduleRef.get<TransportFactory>(TransportFactory);
  });

  describe('createTransports', () => {
    it('should create console transport for development environment', () => {
      // Arrange
      const config = {
        level: LogLevel.DEBUG,
        environment: 'development',
        transports: {
          console: {
            enabled: true,
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(transports[0]['formatter']).toBeInstanceOf(TextFormatter);
    });

    it('should create file transport with correct configuration', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'development',
        transports: {
          file: {
            enabled: true,
            path: '/var/log/austa',
            filename: 'application.log',
            maxSize: '10m',
            maxFiles: 5,
            compress: true,
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(FileTransport);
      expect(transports[0]['formatter']).toBeInstanceOf(JSONFormatter);
      expect(transports[0]['config']).toEqual(config.transports.file);
    });

    it('should create cloudwatch transport for production environment', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          cloudwatch: {
            enabled: true,
            logGroupName: '/austa/superapp',
            logStreamName: 'application',
            region: 'us-east-1',
            batchSize: 100,
            retryCount: 3,
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(CloudWatchTransport);
      expect(transports[0]['formatter']).toBeInstanceOf(CloudWatchFormatter);
      expect(transports[0]['config']).toEqual(config.transports.cloudwatch);
    });

    it('should create multiple transports when multiple are enabled', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          console: {
            enabled: true,
          },
          cloudwatch: {
            enabled: true,
            logGroupName: '/austa/superapp',
            logStreamName: 'application',
            region: 'us-east-1',
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(2);
      expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(transports[1]).toBeInstanceOf(CloudWatchTransport);
    });

    it('should not create disabled transports', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          console: {
            enabled: false,
          },
          file: {
            enabled: false,
            path: '/var/log/austa',
            filename: 'application.log',
          },
          cloudwatch: {
            enabled: true,
            logGroupName: '/austa/superapp',
            logStreamName: 'application',
            region: 'us-east-1',
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(CloudWatchTransport);
    });

    it('should use appropriate formatter based on environment', () => {
      // Arrange
      const devConfig = {
        level: LogLevel.DEBUG,
        environment: 'development',
        transports: {
          console: {
            enabled: true,
          },
        },
      };

      const prodConfig = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          console: {
            enabled: true,
          },
        },
      };

      // Act
      const devTransports = transportFactory.createTransports(devConfig);
      const prodTransports = transportFactory.createTransports(prodConfig);

      // Assert
      expect(devTransports[0]['formatter']).toBeInstanceOf(TextFormatter);
      expect(prodTransports[0]['formatter']).toBeInstanceOf(JSONFormatter);
    });

    it('should override default formatter when explicitly specified', () => {
      // Arrange
      const config = {
        level: LogLevel.DEBUG,
        environment: 'development',
        transports: {
          console: {
            enabled: true,
            formatter: 'json',
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports[0]['formatter']).toBeInstanceOf(JSONFormatter);
    });

    it('should throw error when required configuration is missing', () => {
      // Arrange
      const invalidConfig = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          cloudwatch: {
            enabled: true,
            // Missing required logGroupName
            logStreamName: 'application',
            region: 'us-east-1',
          },
        },
      };

      // Act & Assert
      expect(() => {
        transportFactory.createTransports(invalidConfig);
      }).toThrow(/Missing required configuration: logGroupName/);
    });

    it('should throw error when invalid formatter is specified', () => {
      // Arrange
      const invalidConfig = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          console: {
            enabled: true,
            formatter: 'invalid-formatter',
          },
        },
      };

      // Act & Assert
      expect(() => {
        transportFactory.createTransports(invalidConfig);
      }).toThrow(/Invalid formatter specified: invalid-formatter/);
    });

    it('should throw error when invalid transport type is specified', () => {
      // Arrange
      const invalidConfig = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          invalidTransport: {
            enabled: true,
          },
        },
      };

      // Act & Assert
      expect(() => {
        transportFactory.createTransports(invalidConfig);
      }).toThrow(/Unsupported transport type: invalidTransport/);
    });

    it('should create no transports when none are enabled', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {
          console: {
            enabled: false,
          },
          file: {
            enabled: false,
          },
          cloudwatch: {
            enabled: false,
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(0);
    });

    it('should throw error when no transports are configured', () => {
      // Arrange
      const invalidConfig = {
        level: LogLevel.INFO,
        environment: 'production',
        transports: {},
      };

      // Act & Assert
      expect(() => {
        transportFactory.createTransports(invalidConfig);
      }).toThrow(/No transports configured/);
    });

    it('should apply journey-specific configuration to transports', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'production',
        journeyName: 'health',
        transports: {
          cloudwatch: {
            enabled: true,
            logGroupName: '/austa/superapp',
            logStreamName: '{journeyName}',
            region: 'us-east-1',
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(CloudWatchTransport);
      expect(transports[0]['config'].logStreamName).toBe('health');
    });

    it('should apply environment-specific configuration to transports', () => {
      // Arrange
      const config = {
        level: LogLevel.INFO,
        environment: 'staging',
        transports: {
          cloudwatch: {
            enabled: true,
            logGroupName: '/austa/superapp/{environment}',
            logStreamName: 'application',
            region: 'us-east-1',
          },
        },
      };

      // Act
      const transports = transportFactory.createTransports(config);

      // Assert
      expect(transports).toHaveLength(1);
      expect(transports[0]).toBeInstanceOf(CloudWatchTransport);
      expect(transports[0]['config'].logGroupName).toBe('/austa/superapp/staging');
    });
  });
});
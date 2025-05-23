import { Test } from '@nestjs/testing';
import { TransportFactory, TransportType, AnyTransportConfig, Transport, Formatter } from '../../../src/transports/transport-factory';

// Mock transport implementations
class MockConsoleTransport implements Transport {
  static instances: MockConsoleTransport[] = [];
  config: any;
  formatter: Formatter;
  initialized = false;

  constructor(config: any, formatter: Formatter) {
    this.config = config;
    this.formatter = formatter;
    MockConsoleTransport.instances.push(this);
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async write(entry: any): Promise<void> {
    // Mock implementation
  }

  async close(): Promise<void> {
    // Mock implementation
  }
}

class MockFileTransport implements Transport {
  static instances: MockFileTransport[] = [];
  config: any;
  formatter: Formatter;
  initialized = false;

  constructor(config: any, formatter: Formatter) {
    this.config = config;
    this.formatter = formatter;
    MockFileTransport.instances.push(this);
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async write(entry: any): Promise<void> {
    // Mock implementation
  }

  async close(): Promise<void> {
    // Mock implementation
  }
}

class MockCloudWatchTransport implements Transport {
  static instances: MockCloudWatchTransport[] = [];
  config: any;
  formatter: Formatter;
  initialized = false;

  constructor(config: any, formatter: Formatter) {
    this.config = config;
    this.formatter = formatter;
    MockCloudWatchTransport.instances.push(this);
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async write(entry: any): Promise<void> {
    // Mock implementation
  }

  async close(): Promise<void> {
    // Mock implementation
  }
}

// Mock formatters
class MockJsonFormatter implements Formatter {
  format(entry: any): any {
    return JSON.stringify(entry);
  }
}

class MockTextFormatter implements Formatter {
  format(entry: any): any {
    return `${entry.level}: ${entry.message}`;
  }
}

class MockCloudWatchFormatter implements Formatter {
  format(entry: any): any {
    return JSON.stringify({ ...entry, aws: true });
  }
}

// Mock the dynamic imports
jest.mock('../../../src/transports/console.transport', () => ({
  ConsoleTransport: MockConsoleTransport
}));

jest.mock('../../../src/transports/file.transport', () => ({
  FileTransport: MockFileTransport
}));

jest.mock('../../../src/transports/cloudwatch.transport', () => ({
  CloudWatchTransport: MockCloudWatchTransport
}));

describe('TransportFactory', () => {
  let transportFactory: TransportFactory;
  let formatters: Map<string, Formatter>;

  beforeEach(async () => {
    // Reset mock instances
    MockConsoleTransport.instances = [];
    MockFileTransport.instances = [];
    MockCloudWatchTransport.instances = [];

    // Create formatters map
    formatters = new Map<string, Formatter>();
    formatters.set('json', new MockJsonFormatter());
    formatters.set('text', new MockTextFormatter());
    formatters.set('cloudwatch', new MockCloudWatchFormatter());

    // Create the module with TransportFactory
    const moduleRef = await Test.createTestingModule({
      providers: [TransportFactory],
    }).compile();

    transportFactory = moduleRef.get<TransportFactory>(TransportFactory);
  });

  describe('createTransports', () => {
    it('should create console transport with correct configuration', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          colorize: true,
          prettyPrint: true,
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockConsoleTransport.instances).toHaveLength(1);
      expect(MockConsoleTransport.instances[0].config).toEqual(configs[0]);
      expect(MockConsoleTransport.instances[0].initialized).toBe(true);
    });

    it('should create file transport with correct configuration', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.FILE,
          filename: 'test.log',
          maxSize: '10m',
          maxFiles: 5,
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockFileTransport.instances).toHaveLength(1);
      expect(MockFileTransport.instances[0].config).toEqual(configs[0]);
      expect(MockFileTransport.instances[0].initialized).toBe(true);
    });

    it('should create cloudwatch transport with correct configuration', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CLOUDWATCH,
          logGroupName: '/austa/test',
          logStreamName: 'test-stream',
          awsRegion: 'us-east-1',
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockCloudWatchTransport.instances).toHaveLength(1);
      expect(MockCloudWatchTransport.instances[0].config).toEqual(configs[0]);
      expect(MockCloudWatchTransport.instances[0].initialized).toBe(true);
    });

    it('should create multiple transports from configuration', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          colorize: true,
        },
        {
          type: TransportType.FILE,
          filename: 'test.log',
        },
        {
          type: TransportType.CLOUDWATCH,
          logGroupName: '/austa/test',
          logStreamName: 'test-stream',
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(3);
      expect(MockConsoleTransport.instances).toHaveLength(1);
      expect(MockFileTransport.instances).toHaveLength(1);
      expect(MockCloudWatchTransport.instances).toHaveLength(1);
    });

    it('should skip disabled transports', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          enabled: false,
        },
        {
          type: TransportType.FILE,
          filename: 'test.log',
          enabled: true,
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockConsoleTransport.instances).toHaveLength(0);
      expect(MockFileTransport.instances).toHaveLength(1);
    });

    it('should throw error if no valid transports could be created', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          enabled: false,
        },
        {
          type: TransportType.FILE,
          enabled: false,
          filename: 'test.log',
        },
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs, formatters))
        .rejects
        .toThrow('No valid transports could be created from the provided configuration');
    });

    it('should throw error if configs is not a valid array', async () => {
      // Act & Assert
      await expect(transportFactory.createTransports(null as any, formatters))
        .rejects
        .toThrow('Invalid transport configuration: configs must be a non-empty array');

      await expect(transportFactory.createTransports([] as any[], formatters))
        .rejects
        .toThrow('Invalid transport configuration: configs must be a non-empty array');

      await expect(transportFactory.createTransports({} as any, formatters))
        .rejects
        .toThrow('Invalid transport configuration: configs must be a non-empty array');
    });

    it('should throw error if formatters is not a valid map', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
        },
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs, null as any))
        .rejects
        .toThrow('Invalid formatters: formatters must be a non-empty Map');

      await expect(transportFactory.createTransports(configs, new Map()))
        .rejects
        .toThrow('Invalid formatters: formatters must be a non-empty Map');

      await expect(transportFactory.createTransports(configs, {} as any))
        .rejects
        .toThrow('Invalid formatters: formatters must be a non-empty Map');
    });

    it('should validate file transport configuration', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.FILE,
          // Missing filename
        } as any,
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs, formatters))
        .rejects
        .toThrow('File transport configuration must specify a filename');
    });

    it('should validate cloudwatch transport configuration', async () => {
      // Arrange - missing logGroupName
      const configs1: AnyTransportConfig[] = [
        {
          type: TransportType.CLOUDWATCH,
          logStreamName: 'test-stream',
        } as any,
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs1, formatters))
        .rejects
        .toThrow('CloudWatch transport configuration must specify a logGroupName');

      // Arrange - missing logStreamName
      const configs2: AnyTransportConfig[] = [
        {
          type: TransportType.CLOUDWATCH,
          logGroupName: '/austa/test',
        } as any,
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs2, formatters))
        .rejects
        .toThrow('CloudWatch transport configuration must specify a logStreamName');
    });

    it('should throw error for unsupported transport type', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: 'unsupported' as any,
        },
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs, formatters))
        .rejects
        .toThrow('Unsupported transport type: unsupported');
    });

    it('should continue creating other transports if one fails', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.FILE,
          // Missing filename, will cause validation error
        } as any,
        {
          type: TransportType.CONSOLE,
          colorize: true,
        },
      ];

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        // Act
        const transports = await transportFactory.createTransports(configs, formatters);

        // Assert
        expect(transports).toHaveLength(1);
        expect(MockConsoleTransport.instances).toHaveLength(1);
        expect(MockFileTransport.instances).toHaveLength(0);
        expect(console.error).toHaveBeenCalled();
      } finally {
        // Restore console.error
        console.error = originalConsoleError;
      }
    });
  });

  describe('getFormatter', () => {
    it('should select text formatter for console transport in development', async () => {
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
        },
      ];

      try {
        // Act
        const transports = await transportFactory.createTransports(configs, formatters);

        // Assert
        expect(transports).toHaveLength(1);
        expect(MockConsoleTransport.instances[0].formatter).toBeInstanceOf(MockTextFormatter);
      } finally {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should select json formatter for console transport in production', async () => {
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
        },
      ];

      try {
        // Act
        const transports = await transportFactory.createTransports(configs, formatters);

        // Assert
        expect(transports).toHaveLength(1);
        expect(MockConsoleTransport.instances[0].formatter).toBeInstanceOf(MockJsonFormatter);
      } finally {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should select cloudwatch formatter for cloudwatch transport', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CLOUDWATCH,
          logGroupName: '/austa/test',
          logStreamName: 'test-stream',
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockCloudWatchTransport.instances[0].formatter).toBeInstanceOf(MockCloudWatchFormatter);
    });

    it('should use formatter specified in config', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          formatter: 'json',
        },
      ];

      // Act
      const transports = await transportFactory.createTransports(configs, formatters);

      // Assert
      expect(transports).toHaveLength(1);
      expect(MockConsoleTransport.instances[0].formatter).toBeInstanceOf(MockJsonFormatter);
    });

    it('should throw error if formatter not found', async () => {
      // Arrange
      const configs: AnyTransportConfig[] = [
        {
          type: TransportType.CONSOLE,
          formatter: 'nonexistent',
        },
      ];

      // Act & Assert
      await expect(transportFactory.createTransports(configs, formatters))
        .rejects
        .toThrow('Formatter not found: nonexistent');
    });
  });

  describe('createDefaultTransportConfigs', () => {
    it('should create console and file transports for development environment', () => {
      // Act
      const configs = TransportFactory.createDefaultTransportConfigs('development', 'test-service');

      // Assert
      expect(configs).toHaveLength(2);
      
      // Verify console transport
      const consoleTransport = configs.find(c => c.type === TransportType.CONSOLE);
      expect(consoleTransport).toBeDefined();
      expect(consoleTransport!.enabled).toBe(true);
      expect(consoleTransport!.formatter).toBe('text');
      expect((consoleTransport as any).colorize).toBe(true);
      expect((consoleTransport as any).prettyPrint).toBe(true);

      // Verify file transport
      const fileTransport = configs.find(c => c.type === TransportType.FILE);
      expect(fileTransport).toBeDefined();
      expect(fileTransport!.enabled).toBe(true);
      expect(fileTransport!.formatter).toBe('json');
      expect((fileTransport as any).filename).toBe('test-service.log');
    });

    it('should create console, file, and cloudwatch transports for production environment', () => {
      // Act
      const configs = TransportFactory.createDefaultTransportConfigs('production', 'test-service');

      // Assert
      expect(configs).toHaveLength(3);
      
      // Verify console transport
      const consoleTransport = configs.find(c => c.type === TransportType.CONSOLE);
      expect(consoleTransport).toBeDefined();
      expect(consoleTransport!.enabled).toBe(true);
      expect(consoleTransport!.formatter).toBe('json');
      expect((consoleTransport as any).colorize).toBe(false);
      expect((consoleTransport as any).prettyPrint).toBe(false);

      // Verify file transport
      const fileTransport = configs.find(c => c.type === TransportType.FILE);
      expect(fileTransport).toBeDefined();
      expect(fileTransport!.enabled).toBe(true);
      expect(fileTransport!.formatter).toBe('json');

      // Verify cloudwatch transport
      const cloudwatchTransport = configs.find(c => c.type === TransportType.CLOUDWATCH);
      expect(cloudwatchTransport).toBeDefined();
      expect(cloudwatchTransport!.enabled).toBe(true);
      expect(cloudwatchTransport!.formatter).toBe('cloudwatch');
      expect((cloudwatchTransport as any).logGroupName).toBe('/austa/test-service');
      expect((cloudwatchTransport as any).awsRegion).toBeDefined();
    });

    it('should use AWS_REGION environment variable for cloudwatch transport if available', () => {
      // Arrange
      const originalAwsRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'eu-west-1';

      try {
        // Act
        const configs = TransportFactory.createDefaultTransportConfigs('production', 'test-service');

        // Assert
        const cloudwatchTransport = configs.find(c => c.type === TransportType.CLOUDWATCH);
        expect(cloudwatchTransport).toBeDefined();
        expect((cloudwatchTransport as any).awsRegion).toBe('eu-west-1');
      } finally {
        // Restore AWS_REGION
        process.env.AWS_REGION = originalAwsRegion;
      }
    });
  });
});
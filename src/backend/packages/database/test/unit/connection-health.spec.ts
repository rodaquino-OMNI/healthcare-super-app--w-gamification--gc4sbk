import { Test } from '@nestjs/testing';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConnectionHealth, ConnectionStatus, ConnectionHealthMetrics } from '../../src/connection/connection-health';
import { ConnectionConfig } from '../../src/connection/connection-config';

// Mock implementations
const mockLoggerService = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockTracingService = {
  startSpan: jest.fn().mockReturnValue({
    setAttributes: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  }),
};

const mockConnectionConfig = {
  getHealthOptions: jest.fn().mockReturnValue({
    healthCheckInterval: 1000,
    slowQueryThreshold: 500,
    failureThreshold: 3,
    healthCheckTimeout: 2000,
    enableDetailedMetrics: true,
    enableAutoRecovery: true,
    degradedResponseTimeThreshold: 300,
    unhealthySuccessRateThreshold: 90,
  }),
};

describe('ConnectionHealth', () => {
  let connectionHealth: ConnectionHealth;
  let originalDateNow: () => number;
  
  beforeAll(() => {
    // Store original Date.now implementation
    originalDateNow = Date.now;
    // Mock Date.now to control time in tests
    Date.now = jest.fn();
  });
  
  afterAll(() => {
    // Restore original Date.now implementation
    Date.now = originalDateNow;
  });
  
  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Set initial Date.now value
    (Date.now as jest.Mock).mockReturnValue(1000);
    
    // Create a testing module with our mocked dependencies
    const moduleRef = await Test.createTestingModule({
      providers: [
        ConnectionHealth,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService },
        { provide: ConnectionConfig, useValue: mockConnectionConfig },
      ],
    }).compile();
    
    // Get the ConnectionHealth instance
    connectionHealth = moduleRef.get<ConnectionHealth>(ConnectionHealth);
    
    // Spy on private methods we need to test
    jest.spyOn(connectionHealth as any, 'executeHealthCheckQuery');
    jest.spyOn(connectionHealth as any, 'updateConnectionStatus');
    jest.spyOn(connectionHealth as any, 'attemptRecovery');
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = connectionHealth.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Number.MAX_VALUE,
        successfulQueries: 0,
        failedQueries: 0,
        successRate: 100,
        slowQueries: 0,
        status: ConnectionStatus.HEALTHY,
      }));
    });
    
    it('should log initialization with options', () => {
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'ConnectionHealth initialized with options',
        expect.objectContaining({
          options: expect.any(Object),
          context: 'ConnectionHealth',
        })
      );
    });
    
    it('should use custom health options from config', () => {
      expect(mockConnectionConfig.getHealthOptions).toHaveBeenCalled();
      
      // Create a new instance with custom options
      mockConnectionConfig.getHealthOptions.mockReturnValueOnce({
        healthCheckInterval: 5000,
        slowQueryThreshold: 1000,
        failureThreshold: 5,
      });
      
      const customConnectionHealth = new ConnectionHealth(
        mockLoggerService,
        mockTracingService,
        mockConnectionConfig
      );
      
      // Verify custom options were merged with defaults
      expect(mockLoggerService.log).toHaveBeenLastCalledWith(
        'ConnectionHealth initialized with options',
        expect.objectContaining({
          options: expect.objectContaining({
            healthCheckInterval: 5000,
            slowQueryThreshold: 1000,
            failureThreshold: 5,
          }),
          context: 'ConnectionHealth',
        })
      );
    });
  });
  
  describe('monitoring control', () => {
    it('should start monitoring with specified interval', () => {
      connectionHealth.startMonitoring();
      
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Connection health monitoring started',
        expect.objectContaining({
          initialDelay: 0,
          interval: 1000,
          context: 'ConnectionHealth',
        })
      );
      
      // Fast-forward time to trigger initial health check
      jest.advanceTimersByTime(1);
      expect(connectionHealth['executeHealthCheckQuery']).toHaveBeenCalled();
      
      // Fast-forward time to trigger interval health check
      jest.advanceTimersByTime(1000);
      expect(connectionHealth['executeHealthCheckQuery']).toHaveBeenCalledTimes(2);
    });
    
    it('should start monitoring with initial delay', () => {
      connectionHealth.startMonitoring(500);
      
      // Health check should not be called immediately
      expect(connectionHealth['executeHealthCheckQuery']).not.toHaveBeenCalled();
      
      // Fast-forward time to trigger delayed initial health check
      jest.advanceTimersByTime(500);
      expect(connectionHealth['executeHealthCheckQuery']).toHaveBeenCalledTimes(1);
    });
    
    it('should not start monitoring if already active', () => {
      connectionHealth.startMonitoring();
      mockLoggerService.log.mockClear();
      mockLoggerService.warn.mockClear();
      
      // Try to start monitoring again
      connectionHealth.startMonitoring();
      
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Health monitoring is already active',
        expect.objectContaining({ context: 'ConnectionHealth' })
      );
    });
    
    it('should stop monitoring', () => {
      connectionHealth.startMonitoring();
      connectionHealth.stopMonitoring();
      
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Connection health monitoring stopped',
        expect.objectContaining({ context: 'ConnectionHealth' })
      );
      
      // Clear previous calls to executeHealthCheckQuery
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockClear();
      
      // Fast-forward time to verify no more health checks
      jest.advanceTimersByTime(2000);
      expect(connectionHealth['executeHealthCheckQuery']).not.toHaveBeenCalled();
    });
    
    it('should warn when stopping monitoring that is not active', () => {
      connectionHealth.stopMonitoring();
      
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Health monitoring is not active',
        expect.objectContaining({ context: 'ConnectionHealth' })
      );
    });
  });
  
  describe('health checks', () => {
    beforeEach(() => {
      // Mock executeHealthCheckQuery to resolve successfully by default
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockResolvedValue(undefined);
    });
    
    it('should perform successful health check', async () => {
      // Mock time for response time calculation
      (Date.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      const result = await connectionHealth.performHealthCheck();
      
      expect(result).toBe(true);
      expect(connectionHealth['executeHealthCheckQuery']).toHaveBeenCalled();
      expect(connectionHealth['updateConnectionStatus']).toHaveBeenCalled();
      expect(mockTracingService.startSpan).toHaveBeenCalledWith('database.connection.healthCheck');
      
      // Verify span attributes for successful check
      const spanMock = mockTracingService.startSpan.mock.results[0].value;
      expect(spanMock.setAttributes).toHaveBeenCalledWith({
        'database.connection.status': ConnectionStatus.HEALTHY,
        'database.connection.responseTime': 100,
        'database.connection.healthy': true,
      });
    });
    
    it('should handle failed health check', async () => {
      // Mock executeHealthCheckQuery to reject with error
      const testError = new Error('Test connection error');
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockRejectedValueOnce(testError);
      
      const result = await connectionHealth.performHealthCheck();
      
      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Database connection health check failed',
        expect.objectContaining({
          error: 'Test connection error',
          consecutiveFailures: 1,
          context: 'ConnectionHealth',
        })
      );
      
      // Verify span attributes for failed check
      const spanMock = mockTracingService.startSpan.mock.results[0].value;
      expect(spanMock.setAttributes).toHaveBeenCalledWith({
        'database.connection.status': ConnectionStatus.HEALTHY, // Still healthy after 1 failure
        'database.connection.healthy': false,
        'database.connection.consecutiveFailures': 1,
        'error.type': 'Error',
        'error.message': 'Test connection error',
      });
      expect(spanMock.recordException).toHaveBeenCalledWith(testError);
    });
    
    it('should mark connection as failed after threshold failures', async () => {
      // Mock executeHealthCheckQuery to reject with error
      const testError = new Error('Test connection error');
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockRejectedValue(testError);
      
      // Perform health checks up to failure threshold
      for (let i = 0; i < 3; i++) {
        await connectionHealth.performHealthCheck();
      }
      
      // Verify connection is marked as failed
      const metrics = connectionHealth.getMetrics();
      expect(metrics.status).toBe(ConnectionStatus.FAILED);
      
      // Verify attempt recovery was called
      expect(connectionHealth['attemptRecovery']).toHaveBeenCalled();
    });
    
    it('should not attempt recovery if auto-recovery is disabled', async () => {
      // Create a new instance with auto-recovery disabled
      mockConnectionConfig.getHealthOptions.mockReturnValueOnce({
        failureThreshold: 2,
        enableAutoRecovery: false,
      });
      
      const customConnectionHealth = new ConnectionHealth(
        mockLoggerService,
        mockTracingService,
        mockConnectionConfig
      );
      
      // Spy on private methods
      jest.spyOn(customConnectionHealth as any, 'executeHealthCheckQuery')
        .mockRejectedValue(new Error('Test connection error'));
      jest.spyOn(customConnectionHealth as any, 'attemptRecovery');
      
      // Perform health checks up to failure threshold
      for (let i = 0; i < 2; i++) {
        await customConnectionHealth.performHealthCheck();
      }
      
      // Verify connection is marked as failed
      const metrics = customConnectionHealth.getMetrics();
      expect(metrics.status).toBe(ConnectionStatus.FAILED);
      
      // Verify attempt recovery was not called
      expect(customConnectionHealth['attemptRecovery']).not.toHaveBeenCalled();
    });
  });
  
  describe('metrics recording', () => {
    it('should record successful query metrics', () => {
      // Record multiple successful queries with different response times
      connectionHealth.recordSuccessfulQuery(100);
      connectionHealth.recordSuccessfulQuery(200);
      connectionHealth.recordSuccessfulQuery(300);
      
      const metrics = connectionHealth.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        successfulQueries: 3,
        failedQueries: 0,
        successRate: 100,
        maxResponseTime: 300,
        minResponseTime: 100,
        averageResponseTime: 200, // (100 + 200 + 300) / 3
        slowQueries: 0, // None exceed the threshold of 500ms
      }));
    });
    
    it('should detect slow queries', () => {
      // Record a query that exceeds the slow query threshold
      connectionHealth.recordSuccessfulQuery(600); // Threshold is 500ms
      
      const metrics = connectionHealth.getMetrics();
      
      expect(metrics.slowQueries).toBe(1);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Slow database query detected',
        expect.objectContaining({
          responseTime: 600,
          threshold: 500,
          context: 'ConnectionHealth',
        })
      );
    });
    
    it('should record failed query metrics', () => {
      // Record some successful queries first
      connectionHealth.recordSuccessfulQuery(100);
      connectionHealth.recordSuccessfulQuery(200);
      
      // Record a failed query
      connectionHealth.recordFailedQuery();
      
      const metrics = connectionHealth.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        successfulQueries: 2,
        failedQueries: 1,
        successRate: 2/3 * 100, // 66.67%
        lastFailedConnection: expect.any(Date),
      }));
    });
    
    it('should update pool metrics', () => {
      connectionHealth.updatePoolMetrics(8, 10, 50);
      
      const metrics = connectionHealth.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        poolUtilization: 80, // (8 / 10) * 100
        avgAcquisitionTime: 15, // 0.3 * 50 + 0.7 * 0 (initial value)
      }));
      
      // Test exponential moving average with another update
      connectionHealth.updatePoolMetrics(9, 10, 100);
      
      const updatedMetrics = connectionHealth.getMetrics();
      expect(updatedMetrics.avgAcquisitionTime).toBeCloseTo(40.5); // 0.3 * 100 + 0.7 * 15
    });
    
    it('should log warning for high pool utilization', () => {
      connectionHealth.updatePoolMetrics(9, 10, 50); // 90% utilization
      
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'High database connection pool utilization',
        expect.objectContaining({
          utilization: '90.00%',
          activeConnections: 9,
          maxConnections: 10,
          context: 'ConnectionHealth',
        })
      );
    });
  });
  
  describe('connection status updates', () => {
    it('should mark connection as degraded when average response time exceeds threshold', () => {
      // Record queries with high response times
      for (let i = 0; i < 5; i++) {
        connectionHealth.recordSuccessfulQuery(400); // Above degraded threshold of 300ms
      }
      
      // Manually trigger status update
      connectionHealth['updateConnectionStatus']();
      
      const metrics = connectionHealth.getMetrics();
      expect(metrics.status).toBe(ConnectionStatus.DEGRADED);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Database connection performance degraded',
        expect.objectContaining({
          averageResponseTime: 400,
          threshold: 300,
          context: 'ConnectionHealth',
        })
      );
      
      // Verify status check methods
      expect(connectionHealth.isHealthy()).toBe(false);
      expect(connectionHealth.isDegraded()).toBe(true);
      expect(connectionHealth.isUnhealthy()).toBe(false);
    });
    
    it('should mark connection as unhealthy when success rate falls below threshold', () => {
      // Record some successful queries
      connectionHealth.recordSuccessfulQuery(100);
      connectionHealth.recordSuccessfulQuery(100);
      
      // Record many failed queries to drop success rate
      for (let i = 0; i < 20; i++) {
        connectionHealth.recordFailedQuery();
      }
      
      // Manually trigger status update
      connectionHealth['updateConnectionStatus']();
      
      const metrics = connectionHealth.getMetrics();
      expect(metrics.status).toBe(ConnectionStatus.UNHEALTHY);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Database connection health degraded',
        expect.objectContaining({
          successRate: expect.stringContaining('9.09'), // ~9.09% (2/22)
          threshold: '90%',
          context: 'ConnectionHealth',
        })
      );
      
      // Verify status check methods
      expect(connectionHealth.isHealthy()).toBe(false);
      expect(connectionHealth.isDegraded()).toBe(false);
      expect(connectionHealth.isUnhealthy()).toBe(true);
    });
    
    it('should reset metrics to initial values', () => {
      // Record some metrics
      connectionHealth.recordSuccessfulQuery(100);
      connectionHealth.recordFailedQuery();
      connectionHealth.updatePoolMetrics(5, 10, 50);
      
      // Reset metrics
      connectionHealth.resetMetrics();
      
      const metrics = connectionHealth.getMetrics();
      expect(metrics).toEqual(expect.objectContaining({
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Number.MAX_VALUE,
        successfulQueries: 0,
        failedQueries: 0,
        successRate: 100,
        slowQueries: 0,
        status: ConnectionStatus.HEALTHY,
        poolUtilization: 0,
        avgAcquisitionTime: 0,
      }));
      
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Connection health metrics reset',
        expect.objectContaining({ context: 'ConnectionHealth' })
      );
    });
  });
  
  describe('health reporting', () => {
    it('should generate a comprehensive health report', () => {
      // Record some metrics
      connectionHealth.recordSuccessfulQuery(100);
      connectionHealth.recordSuccessfulQuery(300);
      connectionHealth.recordFailedQuery();
      connectionHealth.updatePoolMetrics(5, 10, 50);
      
      const report = connectionHealth.generateHealthReport();
      
      expect(report).toEqual(expect.objectContaining({
        status: ConnectionStatus.HEALTHY,
        healthy: true,
        metrics: expect.any(Object),
        uptime: expect.any(String),
        lastSuccessful: expect.any(String),
        lastFailed: expect.any(String),
        responseTimeStats: expect.objectContaining({
          avg: expect.stringContaining('200.00'), // (100 + 300) / 2
          min: expect.stringContaining('100.00'),
          max: expect.stringContaining('300.00'),
        }),
        queryStats: expect.objectContaining({
          total: 3,
          successful: 2,
          failed: 1,
          slow: 0,
          successRate: expect.stringContaining('66.67'), // 2/3 * 100
        }),
        poolStats: expect.objectContaining({
          utilization: expect.stringContaining('50.00'), // (5 / 10) * 100
          acquisitionTime: expect.any(String),
        }),
        thresholds: expect.objectContaining({
          slowQuery: '500ms',
          degradedResponseTime: '300ms',
          unhealthySuccessRate: '90%',
          failureThreshold: 3,
        }),
        monitoring: expect.objectContaining({
          active: false,
          interval: '1s',
          timeout: '2s',
          autoRecovery: true,
        }),
      }));
    });
    
    it('should format uptime correctly', () => {
      // Test private formatUptime method
      const formatUptime = (connectionHealth as any).formatUptime.bind(connectionHealth);
      
      expect(formatUptime(30)).toBe('30s');
      expect(formatUptime(90)).toBe('1m 30s');
      expect(formatUptime(3661)).toBe('1h 1m 1s');
      expect(formatUptime(90061)).toBe('1d 1h 1m 1s');
      expect(formatUptime(0)).toBe('0s');
    });
  });
  
  describe('recovery attempts', () => {
    it('should attempt recovery for unhealthy connections', async () => {
      // Mock the private attemptRecovery method to test its behavior
      (connectionHealth['attemptRecovery'] as jest.Mock).mockImplementationOnce(async () => {
        // Simulate successful recovery
        (connectionHealth as any).consecutiveFailures = 0;
      });
      
      // Simulate connection failures up to threshold
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockRejectedValue(
        new Error('Test connection error')
      );
      
      // Perform health checks up to failure threshold
      for (let i = 0; i < 3; i++) {
        await connectionHealth.performHealthCheck();
      }
      
      // Verify recovery was attempted
      expect(connectionHealth['attemptRecovery']).toHaveBeenCalled();
      expect(mockTracingService.startSpan).toHaveBeenCalledWith('database.connection.recovery');
    });
    
    it('should handle recovery failures gracefully', async () => {
      // Mock the private attemptRecovery method to simulate a failed recovery
      (connectionHealth['attemptRecovery'] as jest.Mock).mockImplementationOnce(async () => {
        throw new Error('Recovery failed');
      });
      
      // Simulate connection failures up to threshold
      (connectionHealth['executeHealthCheckQuery'] as jest.Mock).mockRejectedValue(
        new Error('Test connection error')
      );
      
      // Perform health checks up to failure threshold
      for (let i = 0; i < 3; i++) {
        await connectionHealth.performHealthCheck();
      }
      
      // Verify recovery was attempted but failed
      expect(connectionHealth['attemptRecovery']).toHaveBeenCalled();
      
      // Verify error was logged
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Database connection recovery failed',
        expect.objectContaining({
          error: 'Recovery failed',
          context: 'ConnectionHealth',
        })
      );
      
      // Verify span attributes for failed recovery
      const recoverySpan = mockTracingService.startSpan.mock.calls.find(
        call => call[0] === 'database.connection.recovery'
      );
      expect(recoverySpan).toBeDefined();
      
      const spanMock = mockTracingService.startSpan.mock.results[
        mockTracingService.startSpan.mock.calls.indexOf(recoverySpan)
      ].value;
      
      expect(spanMock.setAttributes).toHaveBeenCalledWith({
        'database.connection.recovery.successful': false,
        'error.type': 'Error',
        'error.message': 'Recovery failed',
      });
    });
  });
});
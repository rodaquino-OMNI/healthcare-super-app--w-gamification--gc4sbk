/**
 * @file connection-health.spec.ts
 * @description Unit tests for the ConnectionHealth class that monitors and reports database connection health metrics.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Span } from '@opentelemetry/api';
import { TracingService } from '@austa/tracing';
import {
  ConnectionHealth,
  HealthStatus,
  ConnectionHealthOptions,
  HealthCheckResult,
  PerformanceMetrics,
  ConnectionStatistics,
} from '../../src/connection/connection-health';
import { ConnectionConfig } from '../../src/connection/connection-config';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import {
  ConnectionError,
  ConnectionErrorCategory,
  ConnectionEventEmitter,
  ConnectionEventType,
  DatabaseConnectionType,
  ConnectionStatus,
} from '../../src/types/connection.types';

// Mock dependencies
class MockConnectionConfig {
  healthCheck = {
    enabled: true,
    intervalMs: 1000, // Use a shorter interval for testing
    timeoutMs: 500,
    maxConsecutiveFailures: 3,
    successThreshold: 2,
    failureThreshold: 3,
    autoRecover: true,
    logResults: true,
  };
}

class MockConnectionRetry {
  isCircuitOpen = jest.fn().mockReturnValue(false);
  closeCircuit = jest.fn();
  openCircuit = jest.fn();
}

class MockConnectionEventEmitter {
  emit = jest.fn();
  on = jest.fn();
  off = jest.fn();
}

class MockTracingService {
  startSpan = jest.fn().mockImplementation((name, options) => {
    const mockSpan: Partial<Span> = {
      end: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      recordException: jest.fn(),
    };
    return mockSpan as Span;
  });
}

describe('ConnectionHealth', () => {
  let connectionHealth: ConnectionHealth;
  let connectionConfig: MockConnectionConfig;
  let connectionRetry: MockConnectionRetry;
  let eventEmitter: MockConnectionEventEmitter;
  let tracingService: MockTracingService;
  let module: TestingModule;

  // Test connection IDs
  const testConnectionId = 'test-connection-id';
  const postgresConnectionId = 'postgres-connection-id';
  const redisConnectionId = 'redis-connection-id';

  // Mock the Logger to avoid console output during tests
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create dependencies
    connectionConfig = new MockConnectionConfig();
    connectionRetry = new MockConnectionRetry();
    eventEmitter = new MockConnectionEventEmitter();
    tracingService = new MockTracingService();

    // Create ConnectionHealth instance with test options
    const options: Partial<ConnectionHealthOptions> = {
      maxHistorySize: 10,
      performInitialHealthCheck: false, // Disable initial health check for controlled testing
      healthCheckConcurrency: 5,
      slowQueryThresholdMs: 100, // Lower threshold for testing
      recoveryCheckIntervalMs: 500, // Shorter interval for testing
      simulateFailures: false, // Control failures manually in tests
    };

    // Create the ConnectionHealth instance
    connectionHealth = new ConnectionHealth(
      connectionConfig as unknown as ConnectionConfig,
      connectionRetry as unknown as ConnectionRetry,
      eventEmitter as unknown as ConnectionEventEmitter,
      tracingService as unknown as TracingService,
      options
    );

    // Register test connections
    connectionHealth.registerConnection(
      testConnectionId,
      DatabaseConnectionType.POSTGRES,
      'test-journey'
    );

    connectionHealth.registerConnection(
      postgresConnectionId,
      DatabaseConnectionType.POSTGRES,
      'health'
    );

    connectionHealth.registerConnection(
      redisConnectionId,
      DatabaseConnectionType.REDIS,
      'auth'
    );
  });

  afterEach(async () => {
    // Clean up
    connectionHealth.onModuleDestroy();
  });

  describe('Initialization and Registration', () => {
    it('should initialize health monitoring system', () => {
      // Trigger initialization
      connectionHealth.onModuleInit();

      // Verify that health checks are started
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Started database connection health monitoring')
      );
    });

    it('should register a connection for health monitoring', () => {
      const newConnectionId = 'new-connection-id';
      connectionHealth.registerConnection(
        newConnectionId,
        DatabaseConnectionType.TIMESCALE,
        'care'
      );

      // Verify connection is registered
      const status = connectionHealth.getConnectionStatus(newConnectionId);
      expect(status).toBe(HealthStatus.UNKNOWN);
    });

    it('should unregister a connection from health monitoring', () => {
      // First verify the connection exists
      expect(connectionHealth.getConnectionStatus(testConnectionId)).toBeDefined();

      // Unregister the connection
      connectionHealth.unregisterConnection(testConnectionId);

      // Verify connection is no longer registered
      expect(connectionHealth.getConnectionStatus(testConnectionId)).toBeUndefined();
    });

    it('should not register the same connection twice', () => {
      // Try to register the same connection again
      connectionHealth.registerConnection(
        testConnectionId,
        DatabaseConnectionType.POSTGRES,
        'test-journey'
      );

      // Verify warning was logged
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
    });
  });

  describe('Health Checks', () => {
    it('should perform a health check on a connection', async () => {
      // Mock a successful health check
      const healthCheckFn = jest.fn().mockResolvedValue(true);

      // Perform health check
      const result = await connectionHealth.checkConnectionHealth(testConnectionId, healthCheckFn);

      // Verify health check was performed
      expect(healthCheckFn).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.connectionId).toBe(testConnectionId);
      expect(result.consecutiveSuccesses).toBe(1);
      expect(result.consecutiveFailures).toBe(0);
    });

    it('should handle a failed health check', async () => {
      // Mock a failed health check
      const healthCheckFn = jest.fn().mockResolvedValue(false);

      // Perform health check
      const result = await connectionHealth.checkConnectionHealth(testConnectionId, healthCheckFn);

      // Verify health check was performed
      expect(healthCheckFn).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.connectionId).toBe(testConnectionId);
      expect(result.consecutiveSuccesses).toBe(0);
      expect(result.consecutiveFailures).toBe(1);
    });

    it('should handle an exception during health check', async () => {
      // Mock a health check that throws an exception
      const healthCheckFn = jest.fn().mockRejectedValue(new Error('Connection refused'));

      // Perform health check
      const result = await connectionHealth.checkConnectionHealth(testConnectionId, healthCheckFn);

      // Verify health check was performed
      expect(healthCheckFn).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.connectionId).toBe(testConnectionId);
      expect(result.consecutiveSuccesses).toBe(0);
      expect(result.consecutiveFailures).toBe(1);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Connection refused');
    });

    it('should track consecutive successes and failures', async () => {
      // Mock health check functions
      const successFn = jest.fn().mockResolvedValue(true);
      const failureFn = jest.fn().mockResolvedValue(false);

      // Perform successful health checks
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);

      // Verify consecutive successes
      let result = await connectionHealth.getConnectionHealth(testConnectionId);
      expect(result?.consecutiveSuccesses).toBe(2);
      expect(result?.consecutiveFailures).toBe(0);
      expect(result?.status).toBe(HealthStatus.HEALTHY);

      // Perform failed health checks
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);

      // Verify consecutive failures and reset of successes
      result = await connectionHealth.getConnectionHealth(testConnectionId);
      expect(result?.consecutiveSuccesses).toBe(0);
      expect(result?.consecutiveFailures).toBe(1);
      expect(result?.status).toBe(HealthStatus.DEGRADED);

      // Perform more failed health checks to reach unhealthy threshold
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);

      // Verify connection is now unhealthy
      result = await connectionHealth.getConnectionHealth(testConnectionId);
      expect(result?.consecutiveSuccesses).toBe(0);
      expect(result?.consecutiveFailures).toBe(3);
      expect(result?.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should emit events on health status changes', async () => {
      // Mock health check functions
      const successFn = jest.fn().mockResolvedValue(true);
      const failureFn = jest.fn().mockResolvedValue(false);

      // Perform health checks to trigger status changes
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);

      // Verify events were emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.HEALTH_STATUS_CHANGED,
          connectionId: testConnectionId,
          journeyId: 'test-journey',
          data: expect.objectContaining({
            previousStatus: HealthStatus.HEALTHY,
            newStatus: HealthStatus.DEGRADED,
          }),
        })
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should record and retrieve performance metrics', () => {
      // Record some performance metrics
      connectionHealth.recordPerformanceMetrics(testConnectionId, 50, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 75, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 100, 'query');

      // Retrieve performance metrics
      const metrics = connectionHealth.getConnectionPerformance(testConnectionId);

      // Verify metrics were recorded
      expect(metrics).toBeDefined();
      expect(metrics?.averageResponseTimeMs).toBeGreaterThan(0);
      expect(metrics?.minResponseTimeMs).toBeLessThanOrEqual(metrics?.maxResponseTimeMs);
      expect(metrics?.responseTimeTrend).toBeDefined();
      expect(metrics?.lastMeasuredAt).toBeInstanceOf(Date);
    });

    it('should detect slow queries', () => {
      // Record a slow query (above the threshold)
      connectionHealth.recordPerformanceMetrics(testConnectionId, 200, 'query');

      // Verify warning was logged
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected')
      );

      // Verify event was emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.SLOW_OPERATION,
          connectionId: testConnectionId,
          data: expect.objectContaining({
            operationType: 'query',
            responseTimeMs: 200,
          }),
        })
      );
    });

    it('should calculate response time trends', () => {
      // Record metrics with a degrading trend
      connectionHealth.recordPerformanceMetrics(testConnectionId, 50, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 60, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 70, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 80, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 90, 'query');

      // Get connection statistics
      const stats = connectionHealth.getConnectionStatistics(testConnectionId);

      // Verify response time trend was calculated
      expect(stats).toBeDefined();
      expect(stats?.responseTimeTrend).toBeDefined();
      expect(stats?.responseTimeTrend.length).toBeGreaterThan(0);
      expect(stats?.performanceMetrics.responseTimeTrend).toBe('degrading');
    });
  });

  describe('Connection Recovery', () => {
    it('should initiate recovery for unhealthy connections', async () => {
      // Mock a failed health check function
      const failureFn = jest.fn().mockResolvedValue(false);

      // Perform multiple failed health checks to reach unhealthy threshold
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);

      // Verify connection is unhealthy
      const status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.UNHEALTHY);

      // Verify recovery was initiated
      expect(connectionRetry.closeCircuit).toHaveBeenCalledWith(testConnectionId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.RECOVERY_INITIATED,
          connectionId: testConnectionId,
        })
      );
    });

    it('should transition from unhealthy to recovering to healthy', async () => {
      // Mock health check functions
      const failureFn = jest.fn().mockResolvedValue(false);
      const successFn = jest.fn().mockResolvedValue(true);

      // Make the connection unhealthy
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, failureFn);

      // Verify connection is unhealthy
      let status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.UNHEALTHY);

      // Now simulate recovery with successful health checks
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);

      // Verify connection is in recovering state
      status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.RECOVERING);

      // More successful health checks to reach healthy threshold
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);
      await connectionHealth.checkConnectionHealth(testConnectionId, successFn);

      // Verify connection is now healthy
      status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.HEALTHY);
    });

    it('should allow manual recovery initiation', async () => {
      // Set connection to unhealthy state
      connectionHealth.setConnectionStatus(
        testConnectionId,
        HealthStatus.UNHEALTHY,
        'Manual test'
      );

      // Initiate manual recovery
      connectionHealth.initiateManualRecovery(testConnectionId);

      // Verify recovery was initiated
      expect(connectionRetry.closeCircuit).toHaveBeenCalledWith(testConnectionId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.RECOVERY_INITIATED,
          connectionId: testConnectionId,
          data: expect.objectContaining({
            isManual: true,
          }),
        })
      );

      // Verify connection is in recovering state
      const status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.RECOVERING);
    });
  });

  describe('Health Statistics and Reporting', () => {
    it('should provide connection health statistics', async () => {
      // Record some performance metrics
      connectionHealth.recordPerformanceMetrics(testConnectionId, 50, 'query');
      connectionHealth.recordPerformanceMetrics(testConnectionId, 75, 'query');

      // Perform a health check
      await connectionHealth.checkConnectionHealth(testConnectionId, () => Promise.resolve(true));

      // Get connection statistics
      const stats = connectionHealth.getConnectionStatistics(testConnectionId);

      // Verify statistics
      expect(stats).toBeDefined();
      expect(stats?.connectionId).toBe(testConnectionId);
      expect(stats?.connectionType).toBe(DatabaseConnectionType.POSTGRES);
      expect(stats?.status).toBe(HealthStatus.HEALTHY);
      expect(stats?.journeyId).toBe('test-journey');
      expect(stats?.performanceMetrics).toBeDefined();
      expect(stats?.healthCheckCount).toBeGreaterThan(0);
      expect(stats?.uptimePercentage).toBeDefined();
    });

    it('should provide a health summary across all connections', async () => {
      // Set different health statuses for connections
      connectionHealth.setConnectionStatus(
        testConnectionId,
        HealthStatus.HEALTHY,
        'Test setup'
      );
      connectionHealth.setConnectionStatus(
        postgresConnectionId,
        HealthStatus.DEGRADED,
        'Test setup'
      );
      connectionHealth.setConnectionStatus(
        redisConnectionId,
        HealthStatus.UNHEALTHY,
        'Test setup'
      );

      // Get health summary
      const summary = connectionHealth.getHealthSummary();

      // Verify summary
      expect(summary.total).toBe(3);
      expect(summary.healthy).toBe(1);
      expect(summary.degraded).toBe(1);
      expect(summary.unhealthy).toBe(1);
      expect(summary.byConnectionType[DatabaseConnectionType.POSTGRES]).toBe(2);
      expect(summary.byConnectionType[DatabaseConnectionType.REDIS]).toBe(1);
      expect(summary.byJourney['test-journey']).toBe(1);
      expect(summary.byJourney['health']).toBe(1);
      expect(summary.byJourney['auth']).toBe(1);
    });

    it('should get all connection statistics', () => {
      // Get all connection statistics
      const allStats = connectionHealth.getAllConnectionStatistics();

      // Verify statistics for all connections
      expect(Object.keys(allStats).length).toBe(3);
      expect(allStats[testConnectionId]).toBeDefined();
      expect(allStats[postgresConnectionId]).toBeDefined();
      expect(allStats[redisConnectionId]).toBeDefined();
    });
  });

  describe('Error Handling and Classification', () => {
    it('should classify connection errors correctly', async () => {
      // Test with different error types
      const errors = [
        { message: 'Connection timeout', expectedCategory: ConnectionErrorCategory.TIMEOUT },
        { message: 'Network error', expectedCategory: ConnectionErrorCategory.NETWORK },
        { message: 'Authentication failed', expectedCategory: ConnectionErrorCategory.AUTHENTICATION },
        { message: 'Resource limit exceeded', expectedCategory: ConnectionErrorCategory.RESOURCE_LIMIT },
        { message: 'Configuration error', expectedCategory: ConnectionErrorCategory.CONFIGURATION },
        { message: 'Unknown error', expectedCategory: ConnectionErrorCategory.UNKNOWN },
      ];

      for (const error of errors) {
        // Create a health check function that throws the error
        const healthCheckFn = jest.fn().mockRejectedValue(new Error(error.message));

        // Perform health check
        const result = await connectionHealth.checkConnectionHealth(testConnectionId, healthCheckFn);

        // Verify error classification
        expect(result.error).toBeDefined();
        expect(result.error?.category).toBe(error.expectedCategory);
        expect(result.error?.message).toContain(error.message);
      }
    });

    it('should handle circuit breaker integration', async () => {
      // Mock circuit breaker as open
      connectionRetry.isCircuitOpen.mockReturnValueOnce(true);

      // Perform health check
      const result = await connectionHealth.checkConnectionHealth(testConnectionId);

      // Verify health check failed due to open circuit
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Circuit breaker is open');
    });

    it('should throw an exception if checking an unhealthy connection', () => {
      // Set connection to unhealthy
      connectionHealth.setConnectionStatus(
        testConnectionId,
        HealthStatus.UNHEALTHY,
        'Test setup'
      );

      // Verify exception is thrown
      expect(() => connectionHealth.throwIfUnhealthy(testConnectionId)).toThrow();
    });
  });

  describe('Observability Integration', () => {
    it('should create spans for health checks', async () => {
      // Perform health check
      await connectionHealth.checkConnectionHealth(testConnectionId, () => Promise.resolve(true));

      // Verify span was created
      expect(tracingService.startSpan).toHaveBeenCalledWith(
        'database.health.check',
        expect.objectContaining({
          attributes: expect.objectContaining({
            'db.connection_id': testConnectionId,
          }),
        })
      );
    });

    it('should record exceptions in spans', async () => {
      // Create a health check function that throws an error
      const healthCheckFn = jest.fn().mockRejectedValue(new Error('Test error'));

      // Mock span
      const mockSpan = { end: jest.fn(), recordException: jest.fn(), setAttribute: jest.fn() };
      tracingService.startSpan.mockReturnValueOnce(mockSpan as unknown as Span);

      // Perform health check
      await connectionHealth.checkConnectionHealth(testConnectionId, healthCheckFn);

      // Verify exception was recorded
      expect(mockSpan.recordException).toHaveBeenCalled();
    });

    it('should create spans for batch health checks', async () => {
      // Trigger scheduled health checks
      // We need to access the private method, so we'll use any type
      (connectionHealth as any).performScheduledHealthChecks();

      // Verify batch span was created
      expect(tracingService.startSpan).toHaveBeenCalledWith(
        'database.health.checkBatch',
        expect.objectContaining({
          attributes: expect.objectContaining({
            'db.connection_count': expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Edge Cases and Special Scenarios', () => {
    it('should handle non-existent connections gracefully', () => {
      // Try to get status for non-existent connection
      const status = connectionHealth.getConnectionStatus('non-existent-id');
      expect(status).toBeUndefined();

      // Try to get health for non-existent connection
      const health = connectionHealth.getConnectionHealth('non-existent-id');
      expect(health).toBeUndefined();

      // Try to get performance for non-existent connection
      const performance = connectionHealth.getConnectionPerformance('non-existent-id');
      expect(performance).toBeUndefined();
    });

    it('should handle clearing all health states', () => {
      // Clear all health states
      connectionHealth.clearAllHealthStates();

      // Verify all connections are removed
      const summary = connectionHealth.getHealthSummary();
      expect(summary.total).toBe(0);
    });

    it('should handle marking a connection as used', () => {
      // Mark connection as used
      connectionHealth.markConnectionUsed(testConnectionId);

      // Verify lastUsedAt is updated
      const stats = connectionHealth.getConnectionStatistics(testConnectionId);
      expect(stats?.lastUsedAt).toBeDefined();
      expect(stats?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should handle manual status changes', () => {
      // Set status manually
      connectionHealth.setConnectionStatus(
        testConnectionId,
        HealthStatus.DEGRADED,
        'Manual test'
      );

      // Verify status was updated
      const status = connectionHealth.getConnectionStatus(testConnectionId);
      expect(status).toBe(HealthStatus.DEGRADED);

      // Verify event was emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.HEALTH_STATUS_CHANGED,
          connectionId: testConnectionId,
          data: expect.objectContaining({
            newStatus: HealthStatus.DEGRADED,
            isManual: true,
          }),
        })
      );
    });

    it('should prevent manual recovery of healthy connections', () => {
      // Set connection to healthy
      connectionHealth.setConnectionStatus(
        testConnectionId,
        HealthStatus.HEALTHY,
        'Test setup'
      );

      // Try to initiate manual recovery
      expect(() => connectionHealth.initiateManualRecovery(testConnectionId)).toThrow();

      // Try with force flag
      expect(() => connectionHealth.initiateManualRecovery(testConnectionId, true)).not.toThrow();
    });
  });
});
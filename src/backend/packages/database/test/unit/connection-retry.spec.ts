/**
 * @file connection-retry.spec.ts
 * @description Unit tests for the ConnectionRetry class that provides retry strategies
 * and policies for database connection failures.
 */

import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConnectionRetry, RetryContext, RetryDecision } from '../../src/connection/connection-retry';
import {
  ConnectionError,
  ConnectionErrorCategory,
  ConnectionEventEmitter,
  ConnectionEventType,
  DatabaseConnectionType,
  RetryPolicy,
} from '../../src/types/connection.types';

// Mock Logger to prevent console output during tests
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('ConnectionRetry', () => {
  // Mock connection error factory
  const createMockError = (category: ConnectionErrorCategory, isRetryable = true, code?: string): ConnectionError => ({
    category,
    originalError: new Error('Test error'),
    message: 'Test error message',
    code,
    isRetryable,
    timestamp: new Date(),
  });

  // Mock retry context factory
  const createMockContext = (overrides?: Partial<RetryContext>): RetryContext => ({
    operation: 'connect',
    connectionType: DatabaseConnectionType.POSTGRES,
    ...overrides,
  });

  // Mock event emitter
  const createMockEventEmitter = (): ConnectionEventEmitter => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  });

  // Helper to extract delay from retry decision
  const getDelayFromDecision = (decision: RetryDecision): number => decision.delayMs;

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff with increasing delays', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 5,
          initialDelayMs: 100,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          useJitter: false, // Disable jitter for predictable results
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Get retry decisions for multiple attempts
      connectionRetry.initializeRetryState(connectionId);
      const decision1 = connectionRetry.shouldRetry(connectionId, error, 1, context);
      const decision2 = connectionRetry.shouldRetry(connectionId, error, 2, context);
      const decision3 = connectionRetry.shouldRetry(connectionId, error, 3, context);
      const decision4 = connectionRetry.shouldRetry(connectionId, error, 4, context);
      
      // Assert - Verify exponential growth of delays
      expect(decision1.shouldRetry).toBe(true);
      expect(decision2.shouldRetry).toBe(true);
      expect(decision3.shouldRetry).toBe(true);
      expect(decision4.shouldRetry).toBe(true);
      
      // Delays should follow the pattern: initialDelay * (backoffMultiplier ^ (attempt - 1))
      // With initialDelay=100, backoffMultiplier=2:
      // Attempt 1: 100ms
      // Attempt 2: 200ms
      // Attempt 3: 400ms
      // Attempt 4: 800ms
      expect(decision1.delayMs).toBe(100);
      expect(decision2.delayMs).toBe(200);
      expect(decision3.delayMs).toBe(400);
      expect(decision4.delayMs).toBe(800);
    });

    it('should respect maxDelayMs limit', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 10,
          initialDelayMs: 100,
          maxDelayMs: 500, // Set a low max delay
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Get retry decisions for multiple attempts
      connectionRetry.initializeRetryState(connectionId);
      const decision1 = connectionRetry.shouldRetry(connectionId, error, 1, context);
      const decision2 = connectionRetry.shouldRetry(connectionId, error, 2, context);
      const decision3 = connectionRetry.shouldRetry(connectionId, error, 3, context);
      const decision4 = connectionRetry.shouldRetry(connectionId, error, 4, context);
      const decision5 = connectionRetry.shouldRetry(connectionId, error, 5, context);
      
      // Assert - Verify delays are capped at maxDelayMs
      expect(decision1.delayMs).toBe(100);
      expect(decision2.delayMs).toBe(200);
      expect(decision3.delayMs).toBe(400);
      // These should be capped at maxDelayMs (500)
      expect(decision4.delayMs).toBe(500);
      expect(decision5.delayMs).toBe(500);
    });
  });

  describe('Jitter Implementation', () => {
    it('should add jitter to delay times when enabled', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 5,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          useJitter: true, // Enable jitter
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Get multiple retry decisions for the same attempt to observe jitter
      connectionRetry.initializeRetryState(connectionId);
      const delays: number[] = [];
      
      // Collect 10 delay values for the same retry attempt
      for (let i = 0; i < 10; i++) {
        const decision = connectionRetry.shouldRetry(connectionId, error, 1, context);
        delays.push(decision.delayMs);
      }
      
      // Assert - Verify that delays vary due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1); // Should have multiple unique values due to jitter
      
      // All delays should be within expected range (around 1000ms ± 25%)
      const baseDelay = 1000;
      const jitterFactor = 0.25;
      const minExpectedDelay = baseDelay * (1 - jitterFactor);
      const maxExpectedDelay = baseDelay * (1 + jitterFactor);
      
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(minExpectedDelay);
        expect(delay).toBeLessThanOrEqual(maxExpectedDelay);
      });
    });

    it('should produce consistent delays when jitter is disabled', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 5,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          useJitter: false, // Disable jitter
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Get multiple retry decisions for the same attempt
      connectionRetry.initializeRetryState(connectionId);
      const delays: number[] = [];
      
      // Collect 10 delay values for the same retry attempt
      for (let i = 0; i < 10; i++) {
        const decision = connectionRetry.shouldRetry(connectionId, error, 1, context);
        delays.push(decision.delayMs);
      }
      
      // Assert - Verify that all delays are the same (no jitter)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBe(1); // Should have only one unique value
      expect(delays[0]).toBe(1000); // Should be exactly the initialDelayMs
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should open circuit after reaching failure threshold', () => {
      // Arrange
      const failureThreshold = 3;
      const connectionRetry = new ConnectionRetry({
        circuitBreaker: {
          enabled: true,
          failureThreshold,
          resetTimeoutMs: 30000,
          enableHalfOpenState: true,
          triggerCategories: [ConnectionErrorCategory.NETWORK],
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Simulate consecutive failures
      connectionRetry.initializeRetryState(connectionId);
      
      // First failures (below threshold) should allow retries
      for (let i = 0; i < failureThreshold - 1; i++) {
        const decision = connectionRetry.shouldRetry(connectionId, error, 1, context);
        expect(decision.shouldRetry).toBe(true);
      }
      
      // This failure should trigger the circuit breaker
      const finalDecision = connectionRetry.shouldRetry(connectionId, error, 1, context);
      
      // Assert
      expect(finalDecision.shouldRetry).toBe(false);
      expect(finalDecision.reason).toContain('Circuit breaker opened');
      expect(connectionRetry.isCircuitOpen(connectionId)).toBe(true);
    });

    it('should not open circuit for non-triggering error categories', () => {
      // Arrange
      const failureThreshold = 3;
      const connectionRetry = new ConnectionRetry({
        circuitBreaker: {
          enabled: true,
          failureThreshold,
          resetTimeoutMs: 30000,
          enableHalfOpenState: true,
          triggerCategories: [ConnectionErrorCategory.NETWORK], // Only NETWORK errors trigger
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.AUTHENTICATION); // Different category
      const context = createMockContext();
      
      // Act - Simulate consecutive failures with non-triggering category
      connectionRetry.initializeRetryState(connectionId);
      
      // Multiple failures should still allow retries since they're not in the trigger category
      for (let i = 0; i < failureThreshold + 2; i++) {
        const decision = connectionRetry.shouldRetry(connectionId, error, 1, context);
        expect(decision.shouldRetry).toBe(true);
      }
      
      // Assert - Circuit should remain closed
      expect(connectionRetry.isCircuitOpen(connectionId)).toBe(false);
    });

    it('should respect circuit breaker reset timeout', async () => {
      // Arrange
      const resetTimeoutMs = 100; // Short timeout for testing
      const connectionRetry = new ConnectionRetry({
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          resetTimeoutMs,
          enableHalfOpenState: false, // Disable half-open state for this test
          triggerCategories: [ConnectionErrorCategory.NETWORK],
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Open the circuit
      connectionRetry.initializeRetryState(connectionId);
      for (let i = 0; i < 3; i++) {
        connectionRetry.shouldRetry(connectionId, error, 1, context);
      }
      
      // Verify circuit is open
      expect(connectionRetry.isCircuitOpen(connectionId)).toBe(true);
      
      // Wait for reset timeout to elapse
      await new Promise(resolve => setTimeout(resolve, resetTimeoutMs + 50));
      
      // Try again after timeout
      const decisionAfterTimeout = connectionRetry.shouldRetry(connectionId, error, 1, context);
      
      // Assert - Circuit should allow retry after timeout
      expect(decisionAfterTimeout.shouldRetry).toBe(true);
    });

    it('should support manual circuit control', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      
      // Act & Assert - Manual open
      connectionRetry.openCircuit(connectionId, 'Manual test');
      expect(connectionRetry.isCircuitOpen(connectionId)).toBe(true);
      
      // Act & Assert - Manual close
      connectionRetry.closeCircuit(connectionId);
      expect(connectionRetry.isCircuitOpen(connectionId)).toBe(false);
    });
  });

  describe('Context-Aware Retry Policies', () => {
    it('should apply operation-specific retry policies', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
        operationPolicies: {
          connect: { maxRetries: 5, initialDelayMs: 200 },
          query: { maxRetries: 2, initialDelayMs: 50 },
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      
      // Act - Test with different operation contexts
      connectionRetry.initializeRetryState(connectionId);
      const connectContext = createMockContext({ operation: 'connect' });
      const queryContext = createMockContext({ operation: 'query' });
      
      // Get decisions for each context
      const connectDecision = connectionRetry.shouldRetry(connectionId, error, 1, connectContext);
      const queryDecision = connectionRetry.shouldRetry(connectionId, error, 1, queryContext);
      
      // Assert - Verify different policies are applied
      expect(connectDecision.delayMs).toBe(200); // connect policy initialDelayMs
      expect(queryDecision.delayMs).toBe(50);    // query policy initialDelayMs
      
      // Test max retries by checking if retry is allowed at the policy limit
      const connectMaxRetryDecision = connectionRetry.shouldRetry(connectionId, error, 5, connectContext);
      const queryMaxRetryDecision = connectionRetry.shouldRetry(connectionId, error, 2, queryContext);
      const connectExceededDecision = connectionRetry.shouldRetry(connectionId, error, 6, connectContext);
      const queryExceededDecision = connectionRetry.shouldRetry(connectionId, error, 3, queryContext);
      
      expect(connectMaxRetryDecision.shouldRetry).toBe(true);  // connect allows 5 retries
      expect(queryMaxRetryDecision.shouldRetry).toBe(true);    // query allows 2 retries
      expect(connectExceededDecision.shouldRetry).toBe(false); // connect exceeded at 6
      expect(queryExceededDecision.shouldRetry).toBe(false);   // query exceeded at 3
    });

    it('should apply connection-type-specific retry policies', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
        connectionTypePolicies: {
          [DatabaseConnectionType.POSTGRES]: { maxRetries: 5, initialDelayMs: 200 },
          [DatabaseConnectionType.REDIS]: { maxRetries: 2, initialDelayMs: 50 },
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      
      // Act - Test with different connection types
      connectionRetry.initializeRetryState(connectionId);
      const postgresContext = createMockContext({ connectionType: DatabaseConnectionType.POSTGRES });
      const redisContext = createMockContext({ connectionType: DatabaseConnectionType.REDIS });
      
      // Get decisions for each context
      const postgresDecision = connectionRetry.shouldRetry(connectionId, error, 1, postgresContext);
      const redisDecision = connectionRetry.shouldRetry(connectionId, error, 1, redisContext);
      
      // Assert - Verify different policies are applied
      expect(postgresDecision.delayMs).toBe(200); // postgres policy initialDelayMs
      expect(redisDecision.delayMs).toBe(50);     // redis policy initialDelayMs
    });

    it('should apply journey-specific retry policies', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
        journeyPolicies: {
          auth: { maxRetries: 5, initialDelayMs: 200 },
          health: { maxRetries: 2, initialDelayMs: 50 },
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      
      // Act - Test with different journey contexts
      connectionRetry.initializeRetryState(connectionId);
      const authContext = createMockContext({ 
        journeyContext: { journeyId: 'auth' } 
      });
      const healthContext = createMockContext({ 
        journeyContext: { journeyId: 'health' } 
      });
      
      // Get decisions for each context
      const authDecision = connectionRetry.shouldRetry(connectionId, error, 1, authContext);
      const healthDecision = connectionRetry.shouldRetry(connectionId, error, 1, healthContext);
      
      // Assert - Verify different policies are applied
      expect(authDecision.delayMs).toBe(200);  // auth policy initialDelayMs
      expect(healthDecision.delayMs).toBe(50); // health policy initialDelayMs
    });

    it('should prioritize critical operations', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      
      // Act - Test with critical vs non-critical contexts
      connectionRetry.initializeRetryState(connectionId);
      const criticalContext = createMockContext({ isCritical: true });
      const normalContext = createMockContext({ isCritical: false });
      
      // Try with attempt numbers that would exceed the default policy
      const criticalDecision = connectionRetry.shouldRetry(connectionId, error, 4, criticalContext);
      const normalDecision = connectionRetry.shouldRetry(connectionId, error, 4, normalContext);
      
      // Assert - Critical operations should get more retries
      expect(criticalDecision.shouldRetry).toBe(true);  // Critical operations get more retries
      expect(normalDecision.shouldRetry).toBe(false);   // Normal operations follow default policy
    });

    it('should apply context-specific policy overrides', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      
      // Act - Test with context-specific policy overrides
      connectionRetry.initializeRetryState(connectionId);
      const overrideContext = createMockContext({ 
        policyOverrides: { 
          maxRetries: 10, 
          initialDelayMs: 250 
        } 
      });
      
      // Get decision with overrides
      const overrideDecision = connectionRetry.shouldRetry(connectionId, error, 1, overrideContext);
      
      // Assert - Verify overrides are applied
      expect(overrideDecision.delayMs).toBe(250); // override initialDelayMs
      
      // Test max retries by checking if retry is allowed at higher attempt numbers
      const highAttemptDecision = connectionRetry.shouldRetry(connectionId, error, 8, overrideContext);
      expect(highAttemptDecision.shouldRetry).toBe(true); // Should allow up to 10 retries
    });
  });

  describe('Retry Limits', () => {
    it('should enforce maximum retry attempts', () => {
      // Arrange
      const maxRetries = 3;
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Test retry decisions at and beyond the limit
      connectionRetry.initializeRetryState(connectionId);
      
      // These should allow retries (attempts 1, 2, 3)
      const decision1 = connectionRetry.shouldRetry(connectionId, error, 1, context);
      const decision2 = connectionRetry.shouldRetry(connectionId, error, 2, context);
      const decision3 = connectionRetry.shouldRetry(connectionId, error, 3, context);
      
      // This should deny retry (attempt 4, exceeding maxRetries of 3)
      const decision4 = connectionRetry.shouldRetry(connectionId, error, 4, context);
      
      // Assert
      expect(decision1.shouldRetry).toBe(true);
      expect(decision2.shouldRetry).toBe(true);
      expect(decision3.shouldRetry).toBe(true);
      expect(decision4.shouldRetry).toBe(false);
      expect(decision4.reason).toContain('Maximum retry attempts exceeded');
    });

    it('should not retry non-retryable errors', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      const nonRetryableError = createMockError(ConnectionErrorCategory.AUTHENTICATION, false);
      const context = createMockContext();
      
      // Act
      connectionRetry.initializeRetryState(connectionId);
      const decision = connectionRetry.shouldRetry(connectionId, nonRetryableError, 1, context);
      
      // Assert
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toContain('Error is not retryable');
    });

    it('should retry based on error category', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      const context = createMockContext();
      
      // Create errors of different categories
      const networkError = createMockError(ConnectionErrorCategory.NETWORK);
      const timeoutError = createMockError(ConnectionErrorCategory.TIMEOUT);
      const resourceError = createMockError(ConnectionErrorCategory.RESOURCE_LIMIT);
      const authError = createMockError(ConnectionErrorCategory.AUTHENTICATION);
      const configError = createMockError(ConnectionErrorCategory.CONFIGURATION);
      
      // Act
      connectionRetry.initializeRetryState(connectionId);
      const networkDecision = connectionRetry.shouldRetry(connectionId, networkError, 1, context);
      const timeoutDecision = connectionRetry.shouldRetry(connectionId, timeoutError, 1, context);
      const resourceDecision = connectionRetry.shouldRetry(connectionId, resourceError, 1, context);
      const authDecision = connectionRetry.shouldRetry(connectionId, authError, 1, context);
      const configDecision = connectionRetry.shouldRetry(connectionId, configError, 1, context);
      
      // Assert - Network, timeout, and resource errors should be retryable
      expect(networkDecision.shouldRetry).toBe(true);
      expect(timeoutDecision.shouldRetry).toBe(true);
      expect(resourceDecision.shouldRetry).toBe(true);
      
      // Auth and config errors should not be retryable
      expect(authDecision.shouldRetry).toBe(false);
      expect(configDecision.shouldRetry).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('should retry failed operations and eventually succeed', async () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      const context = createMockContext();
      
      // Mock operation that fails twice then succeeds
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          throw createMockError(ConnectionErrorCategory.NETWORK);
        }
        return 'success';
      });
      
      // Act
      const result = await connectionRetry.executeWithRetry(connectionId, operation, context);
      
      // Assert
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });

    it('should throw after exhausting all retry attempts', async () => {
      // Arrange
      const connectionRetry = new ConnectionRetry({
        defaultPolicy: {
          maxRetries: 2,
          initialDelayMs: 10, // Small delay for faster tests
          maxDelayMs: 50,
          backoffMultiplier: 2,
          useJitter: false,
          connectionTimeoutMs: 5000,
        },
      });
      const connectionId = 'test-connection';
      const context = createMockContext();
      
      // Mock operation that always fails
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const operation = jest.fn().mockRejectedValue(error);
      
      // Act & Assert
      await expect(connectionRetry.executeWithRetry(connectionId, operation, context))
        .rejects.toEqual(error);
      
      // Should have attempted maxRetries + 1 times (initial + retries)
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retry State Management', () => {
    it('should initialize and reset retry state correctly', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Initialize state
      connectionRetry.initializeRetryState(connectionId);
      
      // Simulate some failures
      connectionRetry.shouldRetry(connectionId, error, 1, context);
      connectionRetry.shouldRetry(connectionId, error, 2, context);
      
      // Get state before reset
      const stateBefore = connectionRetry.getRetryState(connectionId);
      
      // Reset state
      connectionRetry.resetRetryState(connectionId);
      
      // Get state after reset
      const stateAfter = connectionRetry.getRetryState(connectionId);
      
      // Assert
      expect(stateBefore?.consecutiveFailures).toBeGreaterThan(0);
      expect(stateAfter?.consecutiveFailures).toBe(0);
      expect(stateAfter?.circuitOpen).toBe(false);
      expect(stateAfter?.lastSuccessAt).toBeDefined();
    });

    it('should track retry statistics', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionId = 'test-connection';
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Initialize state and simulate retries
      connectionRetry.initializeRetryState(connectionId);
      
      // Simulate some failures
      for (let i = 0; i < 3; i++) {
        connectionRetry.shouldRetry(connectionId, error, 1, context);
      }
      
      // Get statistics
      const stats = connectionRetry.getRetryStatistics();
      
      // Assert
      expect(stats[connectionId]).toBeDefined();
      expect(stats[connectionId].totalRetries).toBeGreaterThan(0);
      expect(stats[connectionId].consecutiveFailures).toBeGreaterThan(0);
      expect(stats[connectionId].lastErrorCategory).toBe(ConnectionErrorCategory.NETWORK);
    });

    it('should clear all retry states', () => {
      // Arrange
      const connectionRetry = new ConnectionRetry();
      const connectionIds = ['connection-1', 'connection-2', 'connection-3'];
      const error = createMockError(ConnectionErrorCategory.NETWORK);
      const context = createMockContext();
      
      // Act - Initialize states for multiple connections
      connectionIds.forEach(id => {
        connectionRetry.initializeRetryState(id);
        connectionRetry.shouldRetry(id, error, 1, context);
      });
      
      // Verify states exist
      connectionIds.forEach(id => {
        expect(connectionRetry.getRetryState(id)).toBeDefined();
      });
      
      // Clear all states
      connectionRetry.clearAllRetryStates();
      
      // Assert - All states should be cleared
      connectionIds.forEach(id => {
        expect(connectionRetry.getRetryState(id)).toBeUndefined();
      });
    });
  });
});
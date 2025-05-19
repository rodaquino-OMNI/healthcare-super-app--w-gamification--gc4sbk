import { Test } from '@nestjs/testing';
import { LoggerService } from '@austa/logging';
import { CircuitBreakerMiddleware } from '../../../src/middleware/circuit-breaker.middleware';
import { CircuitState, OperationType } from '../../../src/types/circuit-breaker.types';
import { DatabaseException } from '../../../src/errors';

// Mock LoggerService
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
}

describe('CircuitBreakerMiddleware', () => {
  let circuitBreaker: CircuitBreakerMiddleware;
  let loggerService: MockLoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CircuitBreakerMiddleware,
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    circuitBreaker = moduleRef.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);
    loggerService = moduleRef.get<LoggerService>(LoggerService) as unknown as MockLoggerService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(circuitBreaker).toBeDefined();
  });

  it('should execute operation successfully when circuit is closed', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await circuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
    );

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should open circuit after reaching failure threshold', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Database error'));
    const options = {
      failureThreshold: {
        [OperationType.READ]: 2,
        [OperationType.WRITE]: 2,
        [OperationType.TRANSACTION]: 2,
        [OperationType.MIGRATION]: 2,
      },
      resetTimeout: 30000,
      halfOpenMaxOperations: 3,
      monitoringEnabled: true,
      journeySpecificThresholds: {},
    };

    // Create a new instance with custom options
    const moduleRef = await Test.createTestingModule({
      providers: [
        { 
          provide: CircuitBreakerMiddleware, 
          useFactory: (logger: LoggerService) => new CircuitBreakerMiddleware(logger, options),
          inject: [LoggerService]
        },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    const customCircuitBreaker = moduleRef.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);

    // First failure
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
    )).rejects.toThrow('Database error');

    expect(customCircuitBreaker.getState()).toBe(CircuitState.CLOSED);

    // Second failure - should open the circuit
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
    )).rejects.toThrow('Database error');

    expect(customCircuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Next operation should be rejected with circuit open error
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
    )).rejects.toThrow('Circuit breaker is open');
  });

  it('should use journey-specific thresholds when provided', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Database error'));
    const options = {
      failureThreshold: {
        [OperationType.READ]: 5,
        [OperationType.WRITE]: 5,
        [OperationType.TRANSACTION]: 5,
        [OperationType.MIGRATION]: 5,
      },
      resetTimeout: 30000,
      halfOpenMaxOperations: 3,
      monitoringEnabled: true,
      journeySpecificThresholds: {
        'health': {
          [OperationType.READ]: 1, // Lower threshold for health journey
        },
      },
    };

    // Create a new instance with custom options
    const moduleRef = await Test.createTestingModule({
      providers: [
        { 
          provide: CircuitBreakerMiddleware, 
          useFactory: (logger: LoggerService) => new CircuitBreakerMiddleware(logger, options),
          inject: [LoggerService]
        },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    const customCircuitBreaker = moduleRef.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);

    // First failure with health journey context - should open the circuit immediately
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
      'health',
    )).rejects.toThrow('Database error');

    expect(customCircuitBreaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should transition to half-open state and then closed on successful recovery', async () => {
    // Mock Date.now to control time
    const originalDateNow = Date.now;
    let currentTime = 0;
    Date.now = jest.fn(() => currentTime);

    const options = {
      failureThreshold: {
        [OperationType.READ]: 1,
        [OperationType.WRITE]: 1,
        [OperationType.TRANSACTION]: 1,
        [OperationType.MIGRATION]: 1,
      },
      resetTimeout: 1000, // 1 second for testing
      halfOpenMaxOperations: 1,
      monitoringEnabled: true,
      journeySpecificThresholds: {},
    };

    // Create a new instance with custom options
    const moduleRef = await Test.createTestingModule({
      providers: [
        { 
          provide: CircuitBreakerMiddleware, 
          useFactory: (logger: LoggerService) => new CircuitBreakerMiddleware(logger, options),
          inject: [LoggerService]
        },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    const customCircuitBreaker = moduleRef.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);

    // First operation fails and opens the circuit
    const failingOperation = jest.fn().mockRejectedValue(new Error('Database error'));
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      failingOperation,
      OperationType.READ,
    )).rejects.toThrow('Database error');

    expect(customCircuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Advance time past the reset timeout
    currentTime = 2000; // 2 seconds later

    // Next operation should transition to half-open and succeed
    const successOperation = jest.fn().mockResolvedValue('success');
    const result = await customCircuitBreaker.executeWithCircuitBreaker(
      successOperation,
      OperationType.READ,
    );

    expect(result).toBe('success');
    expect(customCircuitBreaker.getState()).toBe(CircuitState.CLOSED);

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should reset the circuit breaker when manually called', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Database error'));
    const options = {
      failureThreshold: {
        [OperationType.READ]: 1,
        [OperationType.WRITE]: 1,
        [OperationType.TRANSACTION]: 1,
        [OperationType.MIGRATION]: 1,
      },
      resetTimeout: 30000,
      halfOpenMaxOperations: 3,
      monitoringEnabled: true,
      journeySpecificThresholds: {},
    };

    // Create a new instance with custom options
    const moduleRef = await Test.createTestingModule({
      providers: [
        { 
          provide: CircuitBreakerMiddleware, 
          useFactory: (logger: LoggerService) => new CircuitBreakerMiddleware(logger, options),
          inject: [LoggerService]
        },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    const customCircuitBreaker = moduleRef.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);

    // First failure - should open the circuit
    await expect(customCircuitBreaker.executeWithCircuitBreaker(
      operation,
      OperationType.READ,
    )).rejects.toThrow('Database error');

    expect(customCircuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Reset the circuit breaker
    customCircuitBreaker.reset();

    expect(customCircuitBreaker.getState()).toBe(CircuitState.CLOSED);
    expect(customCircuitBreaker.getFailureCount(OperationType.READ)).toBe(0);
  });
});
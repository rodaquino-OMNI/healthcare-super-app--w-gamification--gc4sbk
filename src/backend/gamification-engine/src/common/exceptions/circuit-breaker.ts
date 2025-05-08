import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Failure threshold exceeded, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service has recovered
}

/**
 * Configuration for a circuit breaker
 */
interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;          // Time in ms to wait before trying again (half-open)
  halfOpenSuccessThreshold: number; // Number of successes needed to close circuit
}

/**
 * State of a circuit breaker
 */
interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  resetTimeout: number;
  successes: number;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenSuccessThreshold: 2,
};

/**
 * Service that implements the circuit breaker pattern for external service calls.
 * 
 * The circuit breaker pattern prevents cascading failures by failing fast when
 * an external dependency is experiencing issues. It has three states:
 * 
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */
@Injectable()
export class CircuitBreakerService {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();

  constructor(private readonly logger: LoggerService) {}

  /**
   * Configures a circuit breaker for a dependency
   * 
   * @param dependencyName Name of the dependency
   * @param config Circuit breaker configuration
   */
  configure(dependencyName: string, config: Partial<CircuitBreakerConfig> = {}): void {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.configs.set(dependencyName, fullConfig);
    
    // Initialize circuit if it doesn't exist
    if (!this.circuits.has(dependencyName)) {
      this.circuits.set(dependencyName, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailure: 0,
        resetTimeout: fullConfig.resetTimeout,
        successes: 0,
      });
    }
  }

  /**
   * Records a successful operation for a dependency
   * 
   * @param dependencyName Name of the dependency
   */
  recordSuccess(dependencyName: string): void {
    const circuit = this.getCircuit(dependencyName);
    
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes += 1;
      
      const config = this.getConfig(dependencyName);
      if (circuit.successes >= config.halfOpenSuccessThreshold) {
        this.closeCircuit(dependencyName);
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      circuit.failures = 0;
    }
  }

  /**
   * Records a failed operation for a dependency
   * 
   * @param dependencyName Name of the dependency
   */
  recordFailure(dependencyName: string): void {
    const circuit = this.getCircuit(dependencyName);
    const config = this.getConfig(dependencyName);
    
    circuit.failures += 1;
    circuit.lastFailure = Date.now();
    
    if (circuit.state === CircuitState.CLOSED && circuit.failures >= config.failureThreshold) {
      this.openCircuit(dependencyName);
    } else if (circuit.state === CircuitState.HALF_OPEN) {
      this.openCircuit(dependencyName);
    }
  }

  /**
   * Checks if a circuit is open (failing fast)
   * 
   * @param dependencyName Name of the dependency
   * @returns True if the circuit is open
   */
  isOpen(dependencyName: string): boolean {
    const circuit = this.getCircuit(dependencyName);
    
    // If circuit is open, check if reset timeout has elapsed
    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeElapsed = now - circuit.lastFailure;
      
      if (timeElapsed >= circuit.resetTimeout) {
        this.halfOpenCircuit(dependencyName);
        return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Gets the time in milliseconds until the circuit will reset to half-open
   * 
   * @param dependencyName Name of the dependency
   * @returns Time in milliseconds until reset, or 0 if not applicable
   */
  getResetTime(dependencyName: string): number {
    const circuit = this.getCircuit(dependencyName);
    
    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeElapsed = now - circuit.lastFailure;
      const timeRemaining = Math.max(0, circuit.resetTimeout - timeElapsed);
      
      return timeRemaining;
    }
    
    return 0;
  }

  /**
   * Gets the current state of a circuit
   * 
   * @param dependencyName Name of the dependency
   * @returns Current circuit state
   */
  getState(dependencyName: string): CircuitState {
    return this.getCircuit(dependencyName).state;
  }

  /**
   * Opens a circuit (failing fast)
   * 
   * @param dependencyName Name of the dependency
   */
  private openCircuit(dependencyName: string): void {
    const circuit = this.getCircuit(dependencyName);
    
    if (circuit.state !== CircuitState.OPEN) {
      circuit.state = CircuitState.OPEN;
      circuit.lastFailure = Date.now();
      
      this.logger.warn(`Circuit breaker opened for dependency: ${dependencyName}`, {
        dependencyName,
        failures: circuit.failures,
        resetTimeout: circuit.resetTimeout,
      });
    }
  }

  /**
   * Sets a circuit to half-open (testing recovery)
   * 
   * @param dependencyName Name of the dependency
   */
  private halfOpenCircuit(dependencyName: string): void {
    const circuit = this.getCircuit(dependencyName);
    
    circuit.state = CircuitState.HALF_OPEN;
    circuit.successes = 0;
    
    this.logger.info(`Circuit breaker half-open for dependency: ${dependencyName}`, {
      dependencyName,
    });
  }

  /**
   * Closes a circuit (normal operation)
   * 
   * @param dependencyName Name of the dependency
   */
  private closeCircuit(dependencyName: string): void {
    const circuit = this.getCircuit(dependencyName);
    
    circuit.state = CircuitState.CLOSED;
    circuit.failures = 0;
    circuit.successes = 0;
    
    this.logger.info(`Circuit breaker closed for dependency: ${dependencyName}`, {
      dependencyName,
    });
  }

  /**
   * Gets a circuit, initializing it if it doesn't exist
   * 
   * @param dependencyName Name of the dependency
   * @returns Circuit state
   */
  private getCircuit(dependencyName: string): CircuitBreakerState {
    if (!this.circuits.has(dependencyName)) {
      const config = this.getConfig(dependencyName);
      
      this.circuits.set(dependencyName, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailure: 0,
        resetTimeout: config.resetTimeout,
        successes: 0,
      });
    }
    
    return this.circuits.get(dependencyName)!;
  }

  /**
   * Gets a circuit configuration, using defaults if not configured
   * 
   * @param dependencyName Name of the dependency
   * @returns Circuit configuration
   */
  private getConfig(dependencyName: string): CircuitBreakerConfig {
    if (!this.configs.has(dependencyName)) {
      this.configs.set(dependencyName, { ...DEFAULT_CONFIG });
    }
    
    return this.configs.get(dependencyName)!;
  }
}

// Export the CircuitBreakerService as the default export
export default CircuitBreakerService;
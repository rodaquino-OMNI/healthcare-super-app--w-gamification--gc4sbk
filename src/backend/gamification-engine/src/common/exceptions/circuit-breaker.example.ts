import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker, withCircuitBreaker, withCircuitBreakerAndFallback } from './circuit-breaker';
import { ExternalDependencyException } from './external-dependency.exception';

/**
 * @fileoverview
 * Example usage of the CircuitBreaker pattern in a service.
 * 
 * This file demonstrates different ways to use the circuit breaker pattern
 * to protect services from cascading failures when external dependencies fail.
 * 
 * Note: This is an example file and not meant for production use.
 */

/**
 * Example interface for an external API client
 */
interface ExternalApiClient {
  fetchData(id: string): Promise<any>;
  submitData(data: any): Promise<any>;
}

/**
 * Example service that demonstrates different ways to use the circuit breaker
 */
@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);
  private readonly apiClient: ExternalApiClient;
  
  // Create a circuit breaker instance for direct usage
  private readonly dataServiceBreaker = new CircuitBreaker('data-service', {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    logger: this.logger,
  });
  
  constructor() {
    // Mock API client for example purposes
    this.apiClient = {
      fetchData: async (id: string) => {
        // Simulate API call
        return { id, name: 'Example Data' };
      },
      submitData: async (data: any) => {
        // Simulate API call
        return { success: true, id: '123' };
      },
    };
  }
  
  /**
   * Example 1: Using the CircuitBreaker decorator
   * 
   * This method is protected by a circuit breaker using the decorator pattern.
   * If the external API fails repeatedly, the circuit will open and prevent further calls.
   */
  @CircuitBreaker.Protect('external-api', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
  })
  async getDataWithDecorator(id: string): Promise<any> {
    try {
      return await this.apiClient.fetchData(id);
    } catch (error) {
      // Transform the error to an ExternalDependencyException
      throw new ExternalDependencyException('Failed to fetch data from external API', {
        dependencyName: 'external-api',
        dependencyType: 'rest-api',
        cause: error,
        details: { id },
      });
    }
  }
  
  /**
   * Example 2: Using the CircuitBreaker instance directly
   * 
   * This method uses the circuit breaker instance directly to protect the API call.
   */
  async getDataWithDirectUsage(id: string): Promise<any> {
    return this.dataServiceBreaker.execute(async () => {
      try {
        return await this.apiClient.fetchData(id);
      } catch (error) {
        throw new ExternalDependencyException('Failed to fetch data from data service', {
          dependencyName: 'data-service',
          dependencyType: 'rest-api',
          cause: error,
          details: { id },
        });
      }
    });
  }
  
  /**
   * Example 3: Using the withCircuitBreaker utility function
   * 
   * This method uses the utility function to protect the API call.
   */
  async getDataWithUtilityFunction(id: string): Promise<any> {
    return withCircuitBreaker(
      'analytics-service',
      async () => {
        try {
          return await this.apiClient.fetchData(id);
        } catch (error) {
          throw new ExternalDependencyException('Failed to fetch data from analytics service', {
            dependencyName: 'analytics-service',
            dependencyType: 'rest-api',
            cause: error,
            details: { id },
          });
        }
      },
      {
        failureThreshold: 3,
        resetTimeout: 45000, // 45 seconds
        logger: this.logger,
      }
    );
  }
  
  /**
   * Example 4: Using the withCircuitBreakerAndFallback utility function
   * 
   * This method uses the utility function with a fallback strategy.
   * If the API call fails or the circuit is open, the fallback will be used.
   */
  async getDataWithFallback(id: string): Promise<any> {
    return withCircuitBreakerAndFallback(
      'recommendation-service',
      async () => {
        try {
          return await this.apiClient.fetchData(id);
        } catch (error) {
          throw new ExternalDependencyException('Failed to fetch data from recommendation service', {
            dependencyName: 'recommendation-service',
            dependencyType: 'rest-api',
            cause: error,
            details: { id },
            fallbackOptions: {
              hasFallback: true,
              fallbackType: 'cached-data',
            },
          });
        }
      },
      async (error) => {
        // Fallback strategy: return cached or default data
        this.logger.warn(`Using fallback for recommendation service: ${error.message}`);
        return { id, name: 'Default Recommendation', isFallback: true };
      },
      {
        failureThreshold: 2,
        resetTimeout: 20000, // 20 seconds
        logger: this.logger,
      }
    );
  }
  
  /**
   * Example 5: Using circuit breaker with different configurations for different operations
   * 
   * This method demonstrates how to use different circuit breaker configurations
   * for read and write operations to the same service.
   */
  async submitDataWithCircuitBreaker(data: any): Promise<any> {
    // Use a more conservative circuit breaker for write operations
    return withCircuitBreaker(
      'data-service-write',
      async () => {
        try {
          return await this.apiClient.submitData(data);
        } catch (error) {
          throw new ExternalDependencyException('Failed to submit data to data service', {
            dependencyName: 'data-service-write',
            dependencyType: 'rest-api',
            cause: error,
            details: { dataType: typeof data },
          });
        }
      },
      {
        // More conservative settings for write operations
        failureThreshold: 2, // Trip faster for write operations
        resetTimeout: 60000, // 1 minute - longer reset for write operations
        requestTimeout: 5000, // 5 seconds - shorter timeout for write operations
        logger: this.logger,
      }
    );
  }
}

/**
 * Example controller that uses the example service
 */
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}
  
  async getData(id: string): Promise<any> {
    try {
      // Try different circuit breaker approaches
      const result1 = await this.exampleService.getDataWithDecorator(id);
      const result2 = await this.exampleService.getDataWithDirectUsage(id);
      const result3 = await this.exampleService.getDataWithUtilityFunction(id);
      const result4 = await this.exampleService.getDataWithFallback(id);
      
      return {
        decoratorResult: result1,
        directUsageResult: result2,
        utilityFunctionResult: result3,
        fallbackResult: result4,
      };
    } catch (error) {
      // Handle the error appropriately
      throw error;
    }
  }
  
  async submitData(data: any): Promise<any> {
    return this.exampleService.submitDataWithCircuitBreaker(data);
  }
}
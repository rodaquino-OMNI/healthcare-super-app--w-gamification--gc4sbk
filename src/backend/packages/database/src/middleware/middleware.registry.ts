/**
 * Middleware Registry for managing global middleware configuration across the application.
 * 
 * This registry maintains middleware instances and configurations, allowing for centralized
 * management and dynamic updates at runtime. It enables global middleware policies like
 * mandatory logging and performance tracking while allowing journey-specific overrides.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DatabaseMiddleware,
  LoggingMiddleware,
  PerformanceMiddleware,
  TransformationMiddleware,
  CircuitBreakerMiddleware,
  MiddlewareContext,
} from './middleware.interface';

/**
 * Supported journey contexts in the application
 */
export type JourneyContext = 'health' | 'care' | 'plan' | 'global';

/**
 * Environment profiles for middleware configuration
 */
export type EnvironmentProfile = 'development' | 'test' | 'production';

/**
 * Types of middleware supported by the registry
 */
export type MiddlewareType = 
  | 'logging'
  | 'performance'
  | 'transformation'
  | 'circuit-breaker'
  | 'custom';

/**
 * Configuration for a middleware instance
 */
export interface MiddlewareConfig {
  /**
   * Unique identifier for the middleware
   */
  id: string;
  
  /**
   * Type of middleware
   */
  type: MiddlewareType;
  
  /**
   * Whether the middleware is enabled
   */
  enabled: boolean;
  
  /**
   * Priority of the middleware (higher numbers run first)
   */
  priority: number;
  
  /**
   * Journey contexts this middleware applies to
   */
  journeyContexts: JourneyContext[];
  
  /**
   * Environment profiles this middleware is active in
   */
  environmentProfiles: EnvironmentProfile[];
  
  /**
   * Additional configuration options
   */
  options?: Record<string, any>;
}

/**
 * Registry entry for a middleware instance
 */
interface MiddlewareRegistryEntry {
  /**
   * Middleware instance
   */
  instance: DatabaseMiddleware;
  
  /**
   * Middleware configuration
   */
  config: MiddlewareConfig;
}

/**
 * Registry for managing database middleware across the application
 */
@Injectable()
export class MiddlewareRegistry implements OnModuleInit {
  private readonly logger = new Logger(MiddlewareRegistry.name);
  private readonly registry = new Map<string, MiddlewareRegistryEntry>();
  private readonly journeyPolicies = new Map<JourneyContext, string[]>();
  private currentEnvironment: EnvironmentProfile;
  
  /**
   * Creates a new middleware registry
   * 
   * @param configService Configuration service for environment settings
   */
  constructor(private readonly configService: ConfigService) {
    this.currentEnvironment = this.configService.get<EnvironmentProfile>(
      'NODE_ENV',
      'development',
    ) as EnvironmentProfile;
    
    this.logger.log(`Initialized middleware registry in ${this.currentEnvironment} environment`);
    
    // Initialize journey policies with empty arrays
    this.journeyPolicies.set('global', []);
    this.journeyPolicies.set('health', []);
    this.journeyPolicies.set('care', []);
    this.journeyPolicies.set('plan', []);
  }
  
  /**
   * Initialize the registry with default middleware
   */
  onModuleInit() {
    this.logger.log('Setting up default middleware configurations');
    // Default middleware will be registered by the application bootstrap process
  }
  
  /**
   * Register a middleware instance with the registry
   * 
   * @param middleware Middleware instance to register
   * @param config Configuration for the middleware
   * @returns The ID of the registered middleware
   */
  register(middleware: DatabaseMiddleware, config: MiddlewareConfig): string {
    if (this.registry.has(config.id)) {
      this.logger.warn(`Middleware with ID ${config.id} already exists, overwriting`);
    }
    
    this.registry.set(config.id, { instance: middleware, config });
    
    // Add to journey policies
    for (const journeyContext of config.journeyContexts) {
      const journeyMiddleware = this.journeyPolicies.get(journeyContext) || [];
      if (!journeyMiddleware.includes(config.id)) {
        journeyMiddleware.push(config.id);
        this.journeyPolicies.set(journeyContext, journeyMiddleware);
      }
    }
    
    this.logger.log(
      `Registered ${config.type} middleware with ID ${config.id} for journeys: ${config.journeyContexts.join(', ')}`,
    );
    
    return config.id;
  }
  
  /**
   * Register a logging middleware instance
   * 
   * @param middleware Logging middleware instance
   * @param config Configuration for the middleware
   * @returns The ID of the registered middleware
   */
  registerLoggingMiddleware(
    middleware: LoggingMiddleware,
    config: Omit<MiddlewareConfig, 'type'>,
  ): string {
    return this.register(middleware, { ...config, type: 'logging' });
  }
  
  /**
   * Register a performance middleware instance
   * 
   * @param middleware Performance middleware instance
   * @param config Configuration for the middleware
   * @returns The ID of the registered middleware
   */
  registerPerformanceMiddleware(
    middleware: PerformanceMiddleware,
    config: Omit<MiddlewareConfig, 'type'>,
  ): string {
    return this.register(middleware, { ...config, type: 'performance' });
  }
  
  /**
   * Register a transformation middleware instance
   * 
   * @param middleware Transformation middleware instance
   * @param config Configuration for the middleware
   * @returns The ID of the registered middleware
   */
  registerTransformationMiddleware(
    middleware: TransformationMiddleware,
    config: Omit<MiddlewareConfig, 'type'>,
  ): string {
    return this.register(middleware, { ...config, type: 'transformation' });
  }
  
  /**
   * Register a circuit breaker middleware instance
   * 
   * @param middleware Circuit breaker middleware instance
   * @param config Configuration for the middleware
   * @returns The ID of the registered middleware
   */
  registerCircuitBreakerMiddleware(
    middleware: CircuitBreakerMiddleware,
    config: Omit<MiddlewareConfig, 'type'>,
  ): string {
    return this.register(middleware, { ...config, type: 'circuit-breaker' });
  }
  
  /**
   * Get a middleware instance by ID
   * 
   * @param id ID of the middleware to retrieve
   * @returns The middleware instance or undefined if not found
   */
  getMiddleware(id: string): DatabaseMiddleware | undefined {
    const entry = this.registry.get(id);
    return entry?.instance;
  }
  
  /**
   * Get a middleware instance by ID with type checking
   * 
   * @param id ID of the middleware to retrieve
   * @returns The middleware instance or undefined if not found
   */
  getTypedMiddleware<T extends DatabaseMiddleware>(id: string): T | undefined {
    const middleware = this.getMiddleware(id);
    return middleware as T | undefined;
  }
  
  /**
   * Get a logging middleware instance by ID
   * 
   * @param id ID of the middleware to retrieve
   * @returns The logging middleware instance or undefined if not found
   */
  getLoggingMiddleware(id: string): LoggingMiddleware | undefined {
    const entry = this.registry.get(id);
    if (entry?.config.type !== 'logging') {
      return undefined;
    }
    return entry.instance as LoggingMiddleware;
  }
  
  /**
   * Get a performance middleware instance by ID
   * 
   * @param id ID of the middleware to retrieve
   * @returns The performance middleware instance or undefined if not found
   */
  getPerformanceMiddleware(id: string): PerformanceMiddleware | undefined {
    const entry = this.registry.get(id);
    if (entry?.config.type !== 'performance') {
      return undefined;
    }
    return entry.instance as PerformanceMiddleware;
  }
  
  /**
   * Get a transformation middleware instance by ID
   * 
   * @param id ID of the middleware to retrieve
   * @returns The transformation middleware instance or undefined if not found
   */
  getTransformationMiddleware(id: string): TransformationMiddleware | undefined {
    const entry = this.registry.get(id);
    if (entry?.config.type !== 'transformation') {
      return undefined;
    }
    return entry.instance as TransformationMiddleware;
  }
  
  /**
   * Get a circuit breaker middleware instance by ID
   * 
   * @param id ID of the middleware to retrieve
   * @returns The circuit breaker middleware instance or undefined if not found
   */
  getCircuitBreakerMiddleware(id: string): CircuitBreakerMiddleware | undefined {
    const entry = this.registry.get(id);
    if (entry?.config.type !== 'circuit-breaker') {
      return undefined;
    }
    return entry.instance as CircuitBreakerMiddleware;
  }
  
  /**
   * Get the configuration for a middleware instance
   * 
   * @param id ID of the middleware
   * @returns The middleware configuration or undefined if not found
   */
  getMiddlewareConfig(id: string): MiddlewareConfig | undefined {
    return this.registry.get(id)?.config;
  }
  
  /**
   * Update the configuration for a middleware instance
   * 
   * @param id ID of the middleware to update
   * @param config New configuration (partial)
   * @returns True if the middleware was updated, false otherwise
   */
  updateMiddlewareConfig(id: string, config: Partial<MiddlewareConfig>): boolean {
    const entry = this.registry.get(id);
    if (!entry) {
      return false;
    }
    
    // Handle journey context changes
    if (config.journeyContexts) {
      // Remove from old journey policies
      for (const journeyContext of entry.config.journeyContexts) {
        const journeyMiddleware = this.journeyPolicies.get(journeyContext) || [];
        const index = journeyMiddleware.indexOf(id);
        if (index !== -1) {
          journeyMiddleware.splice(index, 1);
          this.journeyPolicies.set(journeyContext, journeyMiddleware);
        }
      }
      
      // Add to new journey policies
      for (const journeyContext of config.journeyContexts) {
        const journeyMiddleware = this.journeyPolicies.get(journeyContext) || [];
        if (!journeyMiddleware.includes(id)) {
          journeyMiddleware.push(id);
          this.journeyPolicies.set(journeyContext, journeyMiddleware);
        }
      }
    }
    
    // Update the configuration
    entry.config = { ...entry.config, ...config };
    this.registry.set(id, entry);
    
    this.logger.log(`Updated configuration for middleware ${id}`);
    return true;
  }
  
  /**
   * Enable a middleware instance
   * 
   * @param id ID of the middleware to enable
   * @returns True if the middleware was enabled, false otherwise
   */
  enableMiddleware(id: string): boolean {
    return this.updateMiddlewareConfig(id, { enabled: true });
  }
  
  /**
   * Disable a middleware instance
   * 
   * @param id ID of the middleware to disable
   * @returns True if the middleware was disabled, false otherwise
   */
  disableMiddleware(id: string): boolean {
    return this.updateMiddlewareConfig(id, { enabled: false });
  }
  
  /**
   * Remove a middleware instance from the registry
   * 
   * @param id ID of the middleware to remove
   * @returns True if the middleware was removed, false otherwise
   */
  removeMiddleware(id: string): boolean {
    const entry = this.registry.get(id);
    if (!entry) {
      return false;
    }
    
    // Remove from journey policies
    for (const journeyContext of entry.config.journeyContexts) {
      const journeyMiddleware = this.journeyPolicies.get(journeyContext) || [];
      const index = journeyMiddleware.indexOf(id);
      if (index !== -1) {
        journeyMiddleware.splice(index, 1);
        this.journeyPolicies.set(journeyContext, journeyMiddleware);
      }
    }
    
    this.registry.delete(id);
    this.logger.log(`Removed middleware ${id} from registry`);
    return true;
  }
  
  /**
   * Get all middleware instances for a specific journey context
   * 
   * @param journeyContext Journey context to get middleware for
   * @returns Array of middleware instances sorted by priority
   */
  getMiddlewareForJourney(journeyContext: JourneyContext): DatabaseMiddleware[] {
    // Get global middleware and journey-specific middleware
    const globalMiddlewareIds = this.journeyPolicies.get('global') || [];
    const journeyMiddlewareIds = this.journeyPolicies.get(journeyContext) || [];
    
    // Combine and deduplicate middleware IDs
    const middlewareIds = [...new Set([...globalMiddlewareIds, ...journeyMiddlewareIds])];
    
    // Get middleware entries and filter by environment and enabled status
    const middlewareEntries = middlewareIds
      .map(id => this.registry.get(id))
      .filter(entry => 
        entry && 
        entry.config.enabled && 
        entry.config.environmentProfiles.includes(this.currentEnvironment)
      ) as MiddlewareRegistryEntry[];
    
    // Sort by priority (higher numbers first)
    middlewareEntries.sort((a, b) => b.config.priority - a.config.priority);
    
    // Return middleware instances
    return middlewareEntries.map(entry => entry.instance);
  }
  
  /**
   * Get all middleware instances for a specific journey context and type
   * 
   * @param journeyContext Journey context to get middleware for
   * @param type Type of middleware to get
   * @returns Array of middleware instances sorted by priority
   */
  getMiddlewareForJourneyByType(
    journeyContext: JourneyContext,
    type: MiddlewareType,
  ): DatabaseMiddleware[] {
    // Get global middleware and journey-specific middleware
    const globalMiddlewareIds = this.journeyPolicies.get('global') || [];
    const journeyMiddlewareIds = this.journeyPolicies.get(journeyContext) || [];
    
    // Combine and deduplicate middleware IDs
    const middlewareIds = [...new Set([...globalMiddlewareIds, ...journeyMiddlewareIds])];
    
    // Get middleware entries and filter by type, environment, and enabled status
    const middlewareEntries = middlewareIds
      .map(id => this.registry.get(id))
      .filter(entry => 
        entry && 
        entry.config.type === type &&
        entry.config.enabled && 
        entry.config.environmentProfiles.includes(this.currentEnvironment)
      ) as MiddlewareRegistryEntry[];
    
    // Sort by priority (higher numbers first)
    middlewareEntries.sort((a, b) => b.config.priority - a.config.priority);
    
    // Return middleware instances
    return middlewareEntries.map(entry => entry.instance);
  }
  
  /**
   * Execute middleware pipeline for a database operation
   * 
   * @param journeyContext Journey context for the operation
   * @param params Operation parameters
   * @param context Operation context
   * @param operation Function to execute the database operation
   * @returns Result of the operation after middleware processing
   */
  async executeWithMiddleware<T, R>(
    journeyContext: JourneyContext,
    params: T,
    context: MiddlewareContext,
    operation: (params: T) => Promise<R>,
  ): Promise<R> {
    // Get middleware for the journey
    const middleware = this.getMiddlewareForJourney(journeyContext);
    
    // Apply beforeExecute hooks
    let modifiedParams = params;
    for (const mw of middleware) {
      if (mw.beforeExecute) {
        try {
          modifiedParams = await Promise.resolve(mw.beforeExecute(modifiedParams, context));
        } catch (error) {
          this.logger.error(
            `Error in beforeExecute hook of middleware: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }
    }
    
    // Execute the operation
    let result: R;
    try {
      result = await operation(modifiedParams);
    } catch (error) {
      // Apply onError hooks
      let modifiedError = error;
      for (const mw of middleware) {
        if (mw.onError) {
          try {
            modifiedError = await Promise.resolve(mw.onError(modifiedError, context));
          } catch (hookError) {
            this.logger.error(
              `Error in onError hook of middleware: ${hookError.message}`,
              hookError.stack,
            );
          }
        }
      }
      throw modifiedError;
    }
    
    // Apply afterExecute hooks
    let modifiedResult = result;
    for (const mw of middleware) {
      if (mw.afterExecute) {
        try {
          modifiedResult = await Promise.resolve(mw.afterExecute(modifiedResult, context));
        } catch (error) {
          this.logger.error(
            `Error in afterExecute hook of middleware: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }
    }
    
    return modifiedResult;
  }
  
  /**
   * Set the current environment profile
   * 
   * @param environment Environment profile to set
   */
  setEnvironment(environment: EnvironmentProfile): void {
    this.currentEnvironment = environment;
    this.logger.log(`Switched middleware environment to ${environment}`);
  }
  
  /**
   * Get the current environment profile
   * 
   * @returns Current environment profile
   */
  getEnvironment(): EnvironmentProfile {
    return this.currentEnvironment;
  }
  
  /**
   * Get all middleware configurations
   * 
   * @returns Array of all middleware configurations
   */
  getAllMiddlewareConfigs(): MiddlewareConfig[] {
    return Array.from(this.registry.values()).map(entry => entry.config);
  }
  
  /**
   * Get middleware configurations for a specific journey
   * 
   * @param journeyContext Journey context to get configurations for
   * @returns Array of middleware configurations for the journey
   */
  getMiddlewareConfigsForJourney(journeyContext: JourneyContext): MiddlewareConfig[] {
    const middlewareIds = this.journeyPolicies.get(journeyContext) || [];
    return middlewareIds
      .map(id => this.getMiddlewareConfig(id))
      .filter(config => config !== undefined) as MiddlewareConfig[];
  }
  
  /**
   * Create a middleware profile for an environment
   * 
   * @param profileName Name of the profile
   * @param middlewareConfigs Middleware configurations for the profile
   */
  createEnvironmentProfile(
    profileName: string,
    middlewareConfigs: MiddlewareConfig[],
  ): void {
    this.logger.log(`Creating environment profile: ${profileName}`);
    
    // Register all middleware in the profile
    for (const config of middlewareConfigs) {
      // Middleware instances would be created by a factory in a real implementation
      // This is a placeholder for the actual implementation
      this.logger.log(`Would register middleware ${config.id} for profile ${profileName}`);
    }
  }
  
  /**
   * Apply a middleware profile
   * 
   * @param profileName Name of the profile to apply
   */
  applyProfile(profileName: string): void {
    this.logger.log(`Applying middleware profile: ${profileName}`);
    
    // This would load and apply a predefined profile in a real implementation
    // This is a placeholder for the actual implementation
  }
}
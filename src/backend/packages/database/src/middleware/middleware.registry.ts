import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseMiddleware, MiddlewareRegistry as IMiddlewareRegistry } from './middleware.interface';
import { JourneyType } from '../types/journey.types';
import { MetricsService } from '@austa/tracing';

/**
 * Configuration for middleware profiles
 */
export interface MiddlewareProfileConfig {
  /**
   * Name of the profile
   */
  name: string;
  
  /**
   * Whether the profile is enabled
   */
  enabled: boolean;
  
  /**
   * Middleware types to include in this profile
   */
  include: string[];
  
  /**
   * Middleware types to exclude from this profile
   */
  exclude: string[];
}

/**
 * Configuration for journey-specific middleware
 */
export interface JourneyMiddlewareConfig {
  /**
   * Journey type
   */
  journeyType: JourneyType;
  
  /**
   * Middleware types to enable for this journey
   */
  enabledMiddleware: string[];
  
  /**
   * Middleware types to disable for this journey
   */
  disabledMiddleware: string[];
}

/**
 * Registry for managing global middleware configuration across the application.
 * 
 * This registry maintains a collection of middleware instances and configurations,
 * allowing for centralized management and dynamic updates at runtime. It enables
 * global middleware policies like mandatory logging and performance tracking
 * while allowing journey-specific overrides.
 */
@Injectable()
export class MiddlewareRegistry implements IMiddlewareRegistry, OnModuleInit {
  private readonly logger = new Logger(MiddlewareRegistry.name);
  private readonly middlewares: DatabaseMiddleware[] = [];
  private readonly middlewareMap = new Map<string, DatabaseMiddleware>();
  private readonly journeyConfigs = new Map<JourneyType, JourneyMiddlewareConfig>();
  private readonly profiles = new Map<string, MiddlewareProfileConfig>();
  private activeProfile: string = 'default';

  /**
   * Creates a new instance of MiddlewareRegistry
   * @param configService Configuration service for loading middleware settings
   * @param metricsService Optional metrics service for monitoring middleware usage
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService?: MetricsService
  ) {
    this.logger.log('Initializing middleware registry');
  }

  /**
   * Initializes the middleware registry on module initialization
   */
  onModuleInit() {
    this.loadProfiles();
    this.loadJourneyConfigurations();
    this.setActiveProfile(this.configService.get<string>('database.middleware.activeProfile', 'default'));
    this.logger.log(`Middleware registry initialized with active profile: ${this.activeProfile}`);
    
    // Register metrics if metrics service is available
    if (this.metricsService) {
      this.registerMetrics();
    }
  }
  
  /**
   * Registers metrics for monitoring middleware usage
   */
  private registerMetrics(): void {
    // Register gauge for tracking active middleware count
    this.metricsService.registerGauge('database_middleware_active_count', 'Number of active middleware components');
    
    // Register gauge for tracking journey-specific middleware count
    this.metricsService.registerGauge('database_middleware_journey_count', 'Number of middleware components for a journey');
    
    // Register counter for tracking middleware registrations
    this.metricsService.registerCounter('database_middleware_registered', 'Number of middleware components registered');
    
    // Register event for tracking profile changes
    this.metricsService.registerEvent('database_middleware_profile_changed', 'Middleware profile change event');
    
    // Register event for tracking journey configuration updates
    this.metricsService.registerEvent('database_middleware_journey_config_updated', 'Journey middleware configuration update event');
    
    // Register event for tracking active profile updates
    this.metricsService.registerEvent('database_middleware_active_profile_updated', 'Active middleware profile update event');
  }

  /**
   * Loads middleware profiles from configuration
   */
  private loadProfiles() {
    const profiles = this.configService.get<MiddlewareProfileConfig[]>('database.middleware.profiles', []);
    
    // Always ensure we have a default profile
    if (!profiles.some(p => p.name === 'default')) {
      profiles.push({
        name: 'default',
        enabled: true,
        include: ['*'],
        exclude: [],
      });
    }

    profiles.forEach(profile => {
      this.profiles.set(profile.name, profile);
      this.logger.debug(`Loaded middleware profile: ${profile.name}`);
    });
  }

  /**
   * Loads journey-specific middleware configurations
   */
  private loadJourneyConfigurations() {
    const journeyConfigs = this.configService.get<JourneyMiddlewareConfig[]>('database.middleware.journeys', []);
    
    journeyConfigs.forEach(config => {
      this.journeyConfigs.set(config.journeyType, config);
      this.logger.debug(`Loaded journey middleware configuration for: ${config.journeyType}`);
    });
  }

  /**
   * Sets the active middleware profile
   * @param profileName Name of the profile to activate
   */
  setActiveProfile(profileName: string): void {
    if (!this.profiles.has(profileName)) {
      this.logger.warn(`Middleware profile '${profileName}' not found, using default profile`);
      profileName = 'default';
    }

    const previousProfile = this.activeProfile;
    this.activeProfile = profileName;
    this.logger.log(`Activated middleware profile: ${profileName}`);
    
    // Track profile change in metrics if available
    if (this.metricsService) {
      this.metricsService.recordEvent('database_middleware_profile_changed', {
        previous_profile: previousProfile,
        new_profile: profileName,
      });
    }
  }

  /**
   * Gets the active middleware profile
   * @returns Active middleware profile configuration
   */
  getActiveProfile(): MiddlewareProfileConfig {
    return this.profiles.get(this.activeProfile) || {
      name: 'default',
      enabled: true,
      include: ['*'],
      exclude: [],
    };
  }

  /**
   * Registers a middleware component
   * @param middleware Middleware component to register
   */
  register(middleware: DatabaseMiddleware): void {
    const middlewareName = middleware.constructor.name;
    
    // Prevent duplicate registrations
    if (this.middlewareMap.has(middlewareName)) {
      this.logger.warn(`Middleware ${middlewareName} already registered, skipping`);
      return;
    }

    this.middlewares.push(middleware);
    this.middlewareMap.set(middlewareName, middleware);
    this.logger.log(`Registered middleware: ${middlewareName}`);
    
    // Track middleware registration in metrics if available
    if (this.metricsService) {
      this.metricsService.incrementCounter('database_middleware_registered', 1, {
        middleware: middlewareName,
      });
    }
  }

  /**
   * Gets all registered middleware components
   * @returns Array of registered middleware components
   */
  getAll(): DatabaseMiddleware[] {
    const profile = this.getActiveProfile();
    
    if (!profile.enabled) {
      return [];
    }

    // If profile includes all middleware and excludes none, return all middleware
    if (profile.include.includes('*') && profile.exclude.length === 0) {
      return [...this.middlewares];
    }

    // Filter middleware based on profile configuration
    const filteredMiddleware = this.middlewares.filter(middleware => {
      const middlewareName = middleware.constructor.name;
      
      // Check if middleware is explicitly excluded
      if (profile.exclude.includes(middlewareName)) {
        return false;
      }
      
      // Check if middleware is explicitly included or if all middleware is included
      return profile.include.includes(middlewareName) || profile.include.includes('*');
    });
    
    // Track middleware usage in metrics if available
    if (this.metricsService) {
      this.metricsService.gauge('database_middleware_active_count', filteredMiddleware.length, {
        profile: profile.name,
      });
    }
    
    return filteredMiddleware;
  }

  /**
   * Gets middleware components by type
   * @param type Type of middleware to retrieve
   * @returns Array of middleware components of the specified type
   */
  getByType<T extends DatabaseMiddleware>(type: new (...args: any[]) => T): T[] {
    const typeName = type.name;
    const profile = this.getActiveProfile();
    
    if (!profile.enabled) {
      return [];
    }

    // Check if this type is explicitly excluded in the active profile
    if (profile.exclude.includes(typeName)) {
      return [];
    }

    // Check if this type is explicitly included or if all middleware is included
    if (!profile.include.includes(typeName) && !profile.include.includes('*')) {
      return [];
    }

    return this.middlewares.filter(middleware => middleware instanceof type) as T[];
  }

  /**
   * Gets middleware components for a specific journey
   * @param journeyType Type of journey
   * @returns Array of middleware components for the journey
   */
  getForJourney(journeyType: JourneyType): DatabaseMiddleware[] {
    const journeyConfig = this.journeyConfigs.get(journeyType);
    
    // If no journey-specific configuration exists, return all middleware
    if (!journeyConfig) {
      return this.getAll();
    }

    // Filter middleware based on journey configuration
    const journeyMiddleware = this.getAll().filter(middleware => {
      const middlewareName = middleware.constructor.name;
      
      // Check if middleware is explicitly disabled for this journey
      if (journeyConfig.disabledMiddleware.includes(middlewareName)) {
        return false;
      }
      
      // Check if middleware is explicitly enabled for this journey or if no specific enabled list exists
      return journeyConfig.enabledMiddleware.includes(middlewareName) || 
             journeyConfig.enabledMiddleware.includes('*') || 
             journeyConfig.enabledMiddleware.length === 0;
    });
    
    // Track journey-specific middleware usage in metrics if available
    if (this.metricsService) {
      this.metricsService.gauge('database_middleware_journey_count', journeyMiddleware.length, {
        journey: journeyType,
        profile: this.activeProfile,
      });
    }
    
    return journeyMiddleware;
  }

  /**
   * Updates journey-specific middleware configuration
   * @param config Journey middleware configuration to update
   */
  /**
   * Updates journey-specific middleware configuration
   * @param config Journey middleware configuration to update
   * @param options Options for the update operation
   */
  updateJourneyConfiguration(
    config: JourneyMiddlewareConfig, 
    options: { notifyServices?: boolean } = {}
  ): void {
    const previousConfig = this.journeyConfigs.get(config.journeyType);
    this.journeyConfigs.set(config.journeyType, config);
    this.logger.log(`Updated journey middleware configuration for: ${config.journeyType}`);
    
    // Track configuration update in metrics if available
    if (this.metricsService) {
      this.metricsService.recordEvent('database_middleware_journey_config_updated', {
        journey: config.journeyType,
        enabled_count: config.enabledMiddleware.length,
        disabled_count: config.disabledMiddleware.length,
      });
    }
    
    // Emit configuration change event if requested
    if (options.notifyServices) {
      this.logger.log(`Notifying services about journey configuration update for: ${config.journeyType}`);
      // Implementation would depend on the event system used in the application
      // This could be implemented using NestJS EventEmitter or a message broker
    }
  }

  /**
   * Updates middleware profile configuration
   * @param config Middleware profile configuration to update
   */
  /**
   * Updates middleware profile configuration
   * @param config Middleware profile configuration to update
   * @param options Options for the update operation
   */
  updateProfile(
    config: MiddlewareProfileConfig,
    options: { notifyServices?: boolean; activateImmediately?: boolean } = {}
  ): void {
    const previousConfig = this.profiles.get(config.name);
    this.profiles.set(config.name, config);
    this.logger.log(`Updated middleware profile: ${config.name}`);
    
    // If updating the active profile, log a message
    if (config.name === this.activeProfile) {
      this.logger.log(`Active profile '${config.name}' updated`);
      
      // Track active profile update in metrics if available
      if (this.metricsService) {
        this.metricsService.recordEvent('database_middleware_active_profile_updated', {
          profile: config.name,
          enabled: config.enabled,
          include_count: config.include.length,
          exclude_count: config.exclude.length,
        });
      }
    }
    
    // Activate the profile immediately if requested
    if (options.activateImmediately && config.name !== this.activeProfile) {
      this.setActiveProfile(config.name);
    }
    
    // Emit configuration change event if requested
    if (options.notifyServices) {
      this.logger.log(`Notifying services about profile update: ${config.name}`);
      // Implementation would depend on the event system used in the application
      // This could be implemented using NestJS EventEmitter or a message broker
    }
  }

  /**
   * Gets all registered middleware names
   * @returns Array of registered middleware names
   */
  /**
   * Gets all registered middleware names
   * @returns Array of registered middleware names
   */
  getRegisteredMiddlewareNames(): string[] {
    return Array.from(this.middlewareMap.keys());
  }
  
  /**
   * Gets a middleware component by name
   * @param name Name of the middleware to retrieve
   * @returns Middleware component with the specified name, or undefined if not found
   */
  getByName(name: string): DatabaseMiddleware | undefined {
    return this.middlewareMap.get(name);
  }
  
  /**
   * Checks if a middleware is enabled for a specific journey
   * @param middlewareName Name of the middleware to check
   * @param journeyType Type of journey to check
   * @returns True if the middleware is enabled for the journey, false otherwise
   */
  isEnabledForJourney(middlewareName: string, journeyType: JourneyType): boolean {
    const journeyConfig = this.journeyConfigs.get(journeyType);
    
    // If no journey-specific configuration exists, check the active profile
    if (!journeyConfig) {
      const profile = this.getActiveProfile();
      if (!profile.enabled) {
        return false;
      }
      
      return !profile.exclude.includes(middlewareName) && 
             (profile.include.includes(middlewareName) || profile.include.includes('*'));
    }
    
    // Check if middleware is explicitly disabled for this journey
    if (journeyConfig.disabledMiddleware.includes(middlewareName)) {
      return false;
    }
    
    // Check if middleware is explicitly enabled for this journey or if no specific enabled list exists
    return journeyConfig.enabledMiddleware.includes(middlewareName) || 
           journeyConfig.enabledMiddleware.includes('*') || 
           journeyConfig.enabledMiddleware.length === 0;
  }

  /**
   * Gets all available middleware profiles
   * @returns Map of profile names to profile configurations
   */
  getProfiles(): Map<string, MiddlewareProfileConfig> {
    return new Map(this.profiles);
  }

  /**
   * Gets all journey-specific middleware configurations
   * @returns Map of journey types to journey middleware configurations
   */
  getJourneyConfigurations(): Map<JourneyType, JourneyMiddlewareConfig> {
    return new Map(this.journeyConfigs);
  }
}
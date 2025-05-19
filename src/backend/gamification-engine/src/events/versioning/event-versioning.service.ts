import { Injectable, Inject } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { ExternalResponseFormatError } from '@austa/errors/categories';
import { GamificationEvent } from '@austa/interfaces/gamification/events';

/**
 * Service for handling event schema versioning and compatibility.
 * 
 * This service ensures that events with different schema versions can be
 * processed correctly by the gamification engine, providing backward
 * compatibility for older event formats while supporting newer features.
 */
@Injectable()
export class EventVersioningService {
  /**
   * Creates a new instance of the EventVersioningService.
   * 
   * @param logger Service for logging
   * @param schemaRegistry Registry of event schemas for validation
   */
  constructor(
    private readonly logger: LoggerService,
    @Inject('EVENT_SCHEMA_REGISTRY') private readonly schemaRegistry: any
  ) {}

  /**
   * Migrates an event to the current schema version if needed.
   * 
   * @param event The event to migrate
   * @param sourceVersion The source version of the event
   * @returns The migrated event
   * @throws ExternalResponseFormatError if migration fails
   */
  migrateEvent(event: any, sourceVersion?: string): GamificationEvent {
    // If no source version is provided, try to get it from the event
    const version = sourceVersion || event.schemaVersion || '1.0.0';
    const currentVersion = this.schemaRegistry.schemaVersion;
    
    // If the event is already at the current version, return it as is
    if (version === currentVersion) {
      return event as GamificationEvent;
    }
    
    this.logger.log(
      `Migrating event from version ${version} to ${currentVersion}`,
      { eventType: event.type, sourceVersion: version, targetVersion: currentVersion },
      'EventVersioningService'
    );
    
    try {
      // Apply migration strategy based on version
      const migratedEvent = this.applyMigration(event, version, currentVersion);
      
      // Add the current schema version to the event
      migratedEvent.schemaVersion = currentVersion;
      
      return migratedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to migrate event from version ${version} to ${currentVersion}`,
        { eventType: event.type, sourceVersion: version, targetVersion: currentVersion, error: error.message },
        'EventVersioningService'
      );
      
      throw new ExternalResponseFormatError(`Event migration failed: ${error.message}`);
    }
  }
  
  /**
   * Applies migration strategies to convert an event from one version to another.
   * 
   * @param event The event to migrate
   * @param sourceVersion The source version of the event
   * @param targetVersion The target version to migrate to
   * @returns The migrated event
   */
  private applyMigration(event: any, sourceVersion: string, targetVersion: string): GamificationEvent {
    // Clone the event to avoid modifying the original
    const migratedEvent = { ...event };
    
    // Apply migrations based on version paths
    if (this.isVersionLessThan(sourceVersion, '1.1.0') && this.isVersionGreaterOrEqual(targetVersion, '1.1.0')) {
      this.migrateFrom1_0_0To1_1_0(migratedEvent);
    }
    
    if (this.isVersionLessThan(sourceVersion, '1.2.0') && this.isVersionGreaterOrEqual(targetVersion, '1.2.0')) {
      this.migrateFrom1_1_0To1_2_0(migratedEvent);
    }
    
    return migratedEvent as GamificationEvent;
  }
  
  /**
   * Migrates an event from version 1.0.0 to 1.1.0.
   * 
   * @param event The event to migrate
   */
  private migrateFrom1_0_0To1_1_0(event: any): void {
    // Ensure data is an object
    if (!event.data) {
      event.data = {};
    }
    
    // Add timestamp if missing
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }
    
    // Add journey if missing based on event type
    if (!event.journey) {
      if (event.type.startsWith('HEALTH_') || event.type.startsWith('DEVICE_')) {
        event.journey = 'health';
      } else if (event.type.startsWith('CARE_') || event.type.startsWith('APPOINTMENT_') || 
                event.type.startsWith('MEDICATION_') || event.type.startsWith('TELEMEDICINE_')) {
        event.journey = 'care';
      } else if (event.type.startsWith('PLAN_') || event.type.startsWith('CLAIM_') || 
                event.type.startsWith('BENEFIT_')) {
        event.journey = 'plan';
      } else {
        event.journey = 'unknown';
      }
    }
  }
  
  /**
   * Migrates an event from version 1.1.0 to 1.2.0.
   * 
   * @param event The event to migrate
   */
  private migrateFrom1_1_0To1_2_0(event: any): void {
    // Add correlationId if missing
    if (!event.correlationId) {
      event.correlationId = require('uuid').v4();
    }
    
    // Add metadata field if missing
    if (!event.metadata) {
      event.metadata = {};
    }
    
    // Add source field to metadata if missing
    if (!event.metadata.source) {
      event.metadata.source = 'migration';
    }
    
    // Add version field to metadata if missing
    if (!event.metadata.version) {
      event.metadata.version = '1.2.0';
    }
  }
  
  /**
   * Checks if a version is less than another version.
   * 
   * @param version1 The first version
   * @param version2 The second version
   * @returns True if version1 is less than version2, false otherwise
   */
  private isVersionLessThan(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;
      
      if (v1 < v2) return true;
      if (v1 > v2) return false;
    }
    
    return false; // Versions are equal
  }
  
  /**
   * Checks if a version is greater than or equal to another version.
   * 
   * @param version1 The first version
   * @param version2 The second version
   * @returns True if version1 is greater than or equal to version2, false otherwise
   */
  private isVersionGreaterOrEqual(version1: string, version2: string): boolean {
    return !this.isVersionLessThan(version1, version2);
  }
  
  /**
   * Gets the current schema version.
   * 
   * @returns The current schema version
   */
  getCurrentSchemaVersion(): string {
    return this.schemaRegistry.schemaVersion;
  }
}
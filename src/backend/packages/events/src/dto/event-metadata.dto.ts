import { IsString, IsOptional, IsDateString, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Represents version information for an event.
 */
export class EventVersionDto {
  /**
   * Major version number. Incremented for breaking changes.
   */
  @IsString()
  major: string = '1';

  /**
   * Minor version number. Incremented for backward-compatible additions.
   */
  @IsString()
  minor: string = '0';

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   */
  @IsString()
  patch: string = '0';

  /**
   * Returns the full version string in semver format.
   */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}

/**
 * Standard metadata attached to all events in the AUSTA SuperApp.
 * 
 * This DTO provides consistent metadata across all events, enabling
 * tracing, debugging, and event correlation across services.
 */
export class EventMetadataDto {
  /**
   * ISO 8601 timestamp when the event was created.
   */
  @IsDateString()
  timestamp: string = new Date().toISOString();

  /**
   * Service that generated the event.
   */
  @IsString()
  source: string;

  /**
   * Unique identifier for tracing related events across services.
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * User ID associated with the event, if applicable.
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * Journey context (health, care, plan) associated with the event.
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;

  /**
   * Version information for the event schema.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => EventVersionDto)
  version: EventVersionDto = new EventVersionDto();

  /**
   * Additional context data for the event.
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
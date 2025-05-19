import { Injectable, Inject } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { EventsService } from '../../events.service';
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ExternalResponseFormatError } from '@austa/errors/categories';

/**
 * Handler for processing health journey events in the gamification engine.
 * 
 * This handler is responsible for validating and processing events from the health journey,
 * such as health metrics recording, goal achievements, and device connections.
 */
@Injectable()
export class HealthJourneyHandler {
  /**
   * Creates a new instance of the HealthJourneyHandler.
   * 
   * @param eventsService Service for processing gamification events
   * @param logger Service for logging
   * @param schemaRegistry Registry of event schemas for validation
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
    @Inject('EVENT_SCHEMA_REGISTRY') private readonly schemaRegistry: any
  ) {}

  /**
   * Processes a health journey event.
   * 
   * @param payload The event payload
   * @param metadata Additional metadata about the event
   * @returns The result of processing the event
   */
  async processEvent(payload: any, metadata: { correlationId: string; topic: string }): Promise<any> {
    const { correlationId, topic } = metadata;
    
    this.logger.log(
      `Processing health journey event: ${payload.type}`,
      { correlationId, eventType: payload.type, userId: payload.userId, topic },
      'HealthJourneyHandler'
    );
    
    // Validate event against schema
    this.validateEvent(payload);
    
    // Add journey context if not present
    if (!payload.journey) {
      payload.journey = 'health';
    }
    
    // Process the event
    const result = await this.eventsService.processEvent(payload);
    
    this.logger.log(
      `Health journey event processed successfully: ${payload.type}`,
      { 
        correlationId, 
        eventType: payload.type, 
        userId: payload.userId, 
        points: result.points || 0,
        achievements: result.achievements?.length || 0
      },
      'HealthJourneyHandler'
    );
    
    return result;
  }
  
  /**
   * Validates an event against its schema.
   * 
   * @param event The event to validate
   * @throws ExternalResponseFormatError if validation fails
   */
  private validateEvent(event: any): void {
    // Check if event type is supported
    if (!Object.values(EventType).includes(event.type as EventType)) {
      throw new ExternalResponseFormatError(`Unsupported event type: ${event.type}`);
    }
    
    // Get schema for event type
    const schema = this.schemaRegistry.schemas[event.type];
    if (!schema) {
      throw new ExternalResponseFormatError(`No schema found for event type: ${event.type}`);
    }
    
    // Convert plain object to class instance
    const eventInstance = plainToInstance(GamificationEvent, event);
    
    // Validate against schema
    const errors = validateSync(eventInstance);
    if (errors.length > 0) {
      const validationErrors = errors.map(error => {
        return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
      }).join('; ');
      
      throw new ExternalResponseFormatError(`Event validation failed: ${validationErrors}`);
    }
  }
}
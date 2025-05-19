/**
 * @file mock-event-store.ts
 * @description Provides an in-memory event storage mechanism for testing event persistence and retrieval.
 * This mock simulates database operations for storing, querying, and retrieving events without requiring
 * an actual database connection. It supports filtering, sorting, and aggregation operations on stored events,
 * making it ideal for testing event logging and history tracking features.
 */

import { v4 as uuidv4 } from 'uuid';
import { IBaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { IVersionedEvent } from '../../src/interfaces/event-versioning.interface';
import { JourneyType } from '../../src/interfaces/journey-events.interface';

/**
 * Filter options for querying events
 */
export interface EventFilterOptions {
  eventId?: string;
  type?: string | string[];
  source?: string | string[];
  journeyType?: JourneyType;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  version?: string;
  correlationId?: string;
  metadata?: Partial<EventMetadata>;
  [key: string]: any; // Allow additional custom filters
}

/**
 * Sort options for ordering events
 */
export interface EventSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Pagination options for limiting result sets
 */
export interface EventPaginationOptions {
  skip?: number;
  limit?: number;
}

/**
 * Result of a paginated query
 */
export interface PaginatedEventResult<T extends IBaseEvent = IBaseEvent> {
  events: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Options for event aggregation
 */
export interface EventAggregationOptions {
  groupBy: string | string[];
  metrics: {
    field: string;
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    as: string;
  }[];
  filter?: EventFilterOptions;
}

/**
 * Result of an aggregation operation
 */
export interface EventAggregationResult {
  [groupKey: string]: {
    [metricName: string]: number;
  };
}

/**
 * Transaction interface for atomic operations
 */
export interface EventTransaction {
  /**
   * Commit the transaction, applying all changes
   */
  commit(): void;
  
  /**
   * Rollback the transaction, discarding all changes
   */
  rollback(): void;
  
  /**
   * Store an event in the transaction
   * @param event The event to store
   * @returns The stored event with generated ID if not provided
   */
  storeEvent<T extends IBaseEvent>(event: T): T;
  
  /**
   * Update an event in the transaction
   * @param eventId The ID of the event to update
   * @param event The updated event data
   * @returns The updated event
   */
  updateEvent<T extends IBaseEvent>(eventId: string, event: Partial<T>): T;
  
  /**
   * Delete an event in the transaction
   * @param eventId The ID of the event to delete
   * @returns True if the event was deleted, false otherwise
   */
  deleteEvent(eventId: string): boolean;
}

/**
 * In-memory event store for testing event persistence and retrieval
 */
export class MockEventStore {
  private events: Map<string, IBaseEvent> = new Map();
  private eventHistory: Map<string, IBaseEvent[]> = new Map();
  private activeTransactions: Set<EventTransaction> = new Set();
  
  /**
   * Store an event in the mock store
   * @param event The event to store
   * @returns The stored event with generated ID if not provided
   */
  public storeEvent<T extends IBaseEvent>(event: T): T {
    const eventToStore = { ...event };
    
    // Generate an event ID if not provided
    if (!eventToStore.eventId) {
      eventToStore.eventId = uuidv4();
    }
    
    // Set timestamp if not provided
    if (!eventToStore.timestamp) {
      eventToStore.timestamp = new Date().toISOString();
    }
    
    // Store the event
    this.events.set(eventToStore.eventId, eventToStore);
    
    // Add to event history
    this.addToEventHistory(eventToStore);
    
    return eventToStore as T;
  }
  
  /**
   * Retrieve an event by ID
   * @param eventId The ID of the event to retrieve
   * @returns The event if found, undefined otherwise
   */
  public getEvent<T extends IBaseEvent>(eventId: string): T | undefined {
    const event = this.events.get(eventId);
    return event as T | undefined;
  }
  
  /**
   * Update an existing event
   * @param eventId The ID of the event to update
   * @param event The updated event data
   * @returns The updated event
   * @throws Error if the event does not exist
   */
  public updateEvent<T extends IBaseEvent>(eventId: string, event: Partial<T>): T {
    const existingEvent = this.events.get(eventId);
    
    if (!existingEvent) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    
    // Create updated event
    const updatedEvent = {
      ...existingEvent,
      ...event,
      eventId, // Ensure ID doesn't change
    };
    
    // Store updated event
    this.events.set(eventId, updatedEvent);
    
    // Add to event history
    this.addToEventHistory(updatedEvent);
    
    return updatedEvent as T;
  }
  
  /**
   * Delete an event by ID
   * @param eventId The ID of the event to delete
   * @returns True if the event was deleted, false if it didn't exist
   */
  public deleteEvent(eventId: string): boolean {
    // Add to event history before deleting
    const event = this.events.get(eventId);
    if (event) {
      this.addToEventHistory({
        ...event,
        metadata: {
          ...event.metadata,
          deleted: true,
          deletedAt: new Date().toISOString(),
        },
      });
    }
    
    return this.events.delete(eventId);
  }
  
  /**
   * Find events matching the provided filter criteria
   * @param filter Filter criteria for events
   * @param sort Optional sorting of results
   * @param pagination Optional pagination of results
   * @returns Matching events, optionally sorted and paginated
   */
  public findEvents<T extends IBaseEvent>(
    filter: EventFilterOptions = {},
    sort?: EventSortOptions,
    pagination?: EventPaginationOptions
  ): T[] {
    // Convert Map to Array for filtering
    let events = Array.from(this.events.values()) as T[];
    
    // Apply filters
    events = this.applyFilters(events, filter);
    
    // Apply sorting if specified
    if (sort) {
      events = this.applySorting(events, sort);
    } else {
      // Default sort by timestamp descending
      events = this.applySorting(events, { field: 'timestamp', direction: 'desc' });
    }
    
    // Apply pagination if specified
    if (pagination) {
      const { skip = 0, limit } = pagination;
      events = events.slice(skip, limit ? skip + limit : undefined);
    }
    
    return events;
  }
  
  /**
   * Find events with pagination
   * @param filter Filter criteria for events
   * @param sort Optional sorting of results
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @returns Paginated result with events and pagination metadata
   */
  public findEventsPaginated<T extends IBaseEvent>(
    filter: EventFilterOptions = {},
    sort?: EventSortOptions,
    page: number = 1,
    pageSize: number = 10
  ): PaginatedEventResult<T> {
    // Convert Map to Array for filtering
    let events = Array.from(this.events.values()) as T[];
    
    // Apply filters
    events = this.applyFilters(events, filter);
    
    // Get total before pagination
    const total = events.length;
    
    // Apply sorting if specified
    if (sort) {
      events = this.applySorting(events, sort);
    } else {
      // Default sort by timestamp descending
      events = this.applySorting(events, { field: 'timestamp', direction: 'desc' });
    }
    
    // Calculate pagination values
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);
    
    // Apply pagination
    events = events.slice(skip, skip + pageSize);
    
    return {
      events,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
  
  /**
   * Get event history for a specific event ID
   * @param eventId The ID of the event to get history for
   * @returns Array of event versions in chronological order
   */
  public getEventHistory<T extends IBaseEvent>(eventId: string): T[] {
    return (this.eventHistory.get(eventId) || []) as T[];
  }
  
  /**
   * Count events matching the provided filter criteria
   * @param filter Filter criteria for events
   * @returns Number of matching events
   */
  public countEvents(filter: EventFilterOptions = {}): number {
    const events = Array.from(this.events.values());
    return this.applyFilters(events, filter).length;
  }
  
  /**
   * Aggregate events based on specified grouping and metrics
   * @param options Aggregation options
   * @returns Aggregation results
   */
  public aggregateEvents(options: EventAggregationOptions): EventAggregationResult {
    const { groupBy, metrics, filter = {} } = options;
    
    // Get filtered events
    const events = this.applyFilters(Array.from(this.events.values()), filter);
    
    // Group events
    const groups = this.groupEvents(events, groupBy);
    
    // Calculate metrics for each group
    const result: EventAggregationResult = {};
    
    for (const [groupKey, groupEvents] of Object.entries(groups)) {
      result[groupKey] = {};
      
      for (const metric of metrics) {
        const { field, operation, as } = metric;
        result[groupKey][as] = this.calculateMetric(groupEvents, field, operation);
      }
    }
    
    return result;
  }
  
  /**
   * Start a new transaction for atomic operations
   * @returns A new transaction object
   */
  public startTransaction(): EventTransaction {
    // Create a snapshot of current events for potential rollback
    const snapshot = new Map(this.events);
    
    // Create transaction object
    const transaction: EventTransaction = {
      commit: () => {
        this.activeTransactions.delete(transaction);
      },
      
      rollback: () => {
        // Restore events from snapshot
        this.events = snapshot;
        this.activeTransactions.delete(transaction);
      },
      
      storeEvent: <T extends IBaseEvent>(event: T): T => {
        return this.storeEvent(event);
      },
      
      updateEvent: <T extends IBaseEvent>(eventId: string, event: Partial<T>): T => {
        return this.updateEvent(eventId, event);
      },
      
      deleteEvent: (eventId: string): boolean => {
        return this.deleteEvent(eventId);
      },
    };
    
    // Track active transaction
    this.activeTransactions.add(transaction);
    
    return transaction;
  }
  
  /**
   * Clear all events from the store
   */
  public clear(): void {
    this.events.clear();
    this.eventHistory.clear();
  }
  
  /**
   * Get the total number of events in the store
   * @returns Total event count
   */
  public size(): number {
    return this.events.size;
  }
  
  /**
   * Check if the store contains an event with the specified ID
   * @param eventId The event ID to check
   * @returns True if the event exists, false otherwise
   */
  public hasEvent(eventId: string): boolean {
    return this.events.has(eventId);
  }
  
  /**
   * Get all events in the store
   * @returns Array of all events
   */
  public getAllEvents<T extends IBaseEvent>(): T[] {
    return Array.from(this.events.values()) as T[];
  }
  
  /**
   * Find events by type
   * @param type Event type to search for
   * @returns Array of matching events
   */
  public findEventsByType<T extends IBaseEvent>(type: string): T[] {
    return this.findEvents<T>({ type });
  }
  
  /**
   * Find events by source
   * @param source Event source to search for
   * @returns Array of matching events
   */
  public findEventsBySource<T extends IBaseEvent>(source: string): T[] {
    return this.findEvents<T>({ source });
  }
  
  /**
   * Find events by journey type
   * @param journeyType Journey type to search for
   * @returns Array of matching events
   */
  public findEventsByJourney<T extends IBaseEvent>(journeyType: JourneyType): T[] {
    return this.findEvents<T>({ journeyType });
  }
  
  /**
   * Find events by user ID
   * @param userId User ID to search for
   * @returns Array of matching events
   */
  public findEventsByUser<T extends IBaseEvent>(userId: string): T[] {
    return this.findEvents<T>({ userId });
  }
  
  /**
   * Find events by correlation ID
   * @param correlationId Correlation ID to search for
   * @returns Array of matching events
   */
  public findEventsByCorrelation<T extends IBaseEvent>(correlationId: string): T[] {
    return this.findEvents<T>({ correlationId });
  }
  
  /**
   * Find events within a date range
   * @param fromDate Start date (inclusive)
   * @param toDate End date (inclusive)
   * @returns Array of matching events
   */
  public findEventsByDateRange<T extends IBaseEvent>(fromDate: string, toDate: string): T[] {
    return this.findEvents<T>({ fromDate, toDate });
  }
  
  /**
   * Find events by version
   * @param version Version to search for
   * @returns Array of matching events
   */
  public findEventsByVersion<T extends IBaseEvent & IVersionedEvent>(version: string): T[] {
    return this.findEvents<T>({ version });
  }
  
  /**
   * Get a timeline of events for a specific user
   * @param userId User ID to get timeline for
   * @param limit Optional limit on number of events
   * @returns Array of events in chronological order
   */
  public getUserTimeline<T extends IBaseEvent>(userId: string, limit?: number): T[] {
    const events = this.findEvents<T>(
      { userId },
      { field: 'timestamp', direction: 'desc' },
      { limit }
    );
    return events;
  }
  
  /**
   * Get a timeline of events for a specific journey
   * @param journeyType Journey type to get timeline for
   * @param userId Optional user ID to filter by
   * @param limit Optional limit on number of events
   * @returns Array of events in chronological order
   */
  public getJourneyTimeline<T extends IBaseEvent>(
    journeyType: JourneyType,
    userId?: string,
    limit?: number
  ): T[] {
    const filter: EventFilterOptions = { journeyType };
    if (userId) {
      filter.userId = userId;
    }
    
    const events = this.findEvents<T>(
      filter,
      { field: 'timestamp', direction: 'desc' },
      { limit }
    );
    return events;
  }
  
  /**
   * Get events grouped by day
   * @param filter Optional filter criteria
   * @returns Events grouped by day with count
   */
  public getEventsByDay(filter: EventFilterOptions = {}): EventAggregationResult {
    return this.aggregateEvents({
      groupBy: 'day',
      metrics: [{ field: 'eventId', operation: 'count', as: 'count' }],
      filter,
    });
  }
  
  /**
   * Get events grouped by type with count
   * @param filter Optional filter criteria
   * @returns Events grouped by type with count
   */
  public getEventCountByType(filter: EventFilterOptions = {}): EventAggregationResult {
    return this.aggregateEvents({
      groupBy: 'type',
      metrics: [{ field: 'eventId', operation: 'count', as: 'count' }],
      filter,
    });
  }
  
  /**
   * Get events grouped by source with count
   * @param filter Optional filter criteria
   * @returns Events grouped by source with count
   */
  public getEventCountBySource(filter: EventFilterOptions = {}): EventAggregationResult {
    return this.aggregateEvents({
      groupBy: 'source',
      metrics: [{ field: 'eventId', operation: 'count', as: 'count' }],
      filter,
    });
  }
  
  /**
   * Get events grouped by journey with count
   * @param filter Optional filter criteria
   * @returns Events grouped by journey with count
   */
  public getEventCountByJourney(filter: EventFilterOptions = {}): EventAggregationResult {
    return this.aggregateEvents({
      groupBy: 'journeyType',
      metrics: [{ field: 'eventId', operation: 'count', as: 'count' }],
      filter,
    });
  }
  
  /**
   * Get the distribution of event versions
   * @returns Events grouped by version with count
   */
  public getEventVersionDistribution(): EventAggregationResult {
    return this.aggregateEvents({
      groupBy: 'version',
      metrics: [{ field: 'eventId', operation: 'count', as: 'count' }],
    });
  }
  
  // Private helper methods
  
  /**
   * Add an event to the event history
   * @param event The event to add to history
   */
  private addToEventHistory(event: IBaseEvent): void {
    const { eventId } = event;
    const history = this.eventHistory.get(eventId) || [];
    
    // Create a deep copy of the event for history
    const historicalEvent = JSON.parse(JSON.stringify(event));
    
    // Add timestamp for this version if not present
    if (!historicalEvent.metadata) {
      historicalEvent.metadata = {};
    }
    
    historicalEvent.metadata.historyTimestamp = new Date().toISOString();
    
    // Add to history
    history.push(historicalEvent);
    this.eventHistory.set(eventId, history);
  }
  
  /**
   * Apply filters to an array of events
   * @param events Array of events to filter
   * @param filter Filter criteria
   * @returns Filtered array of events
   */
  private applyFilters<T extends IBaseEvent>(events: T[], filter: EventFilterOptions): T[] {
    return events.filter(event => {
      // Check each filter criterion
      for (const [key, value] of Object.entries(filter)) {
        if (value === undefined) continue;
        
        switch (key) {
          case 'eventId':
            if (event.eventId !== value) return false;
            break;
            
          case 'type':
            if (Array.isArray(value)) {
              if (!value.includes(event.type)) return false;
            } else if (event.type !== value) {
              return false;
            }
            break;
            
          case 'source':
            if (Array.isArray(value)) {
              if (!value.includes(event.source)) return false;
            } else if (event.source !== value) {
              return false;
            }
            break;
            
          case 'journeyType':
            // Check in metadata or payload
            const journeyType = 
              (event.metadata?.journey as JourneyType) || 
              (event.payload as any)?.journeyType;
            if (journeyType !== value) return false;
            break;
            
          case 'userId':
            // Check in metadata or payload
            const userId = 
              event.metadata?.userId || 
              (event.payload as any)?.userId;
            if (userId !== value) return false;
            break;
            
          case 'fromDate':
            if (new Date(event.timestamp) < new Date(value as string)) return false;
            break;
            
          case 'toDate':
            if (new Date(event.timestamp) > new Date(value as string)) return false;
            break;
            
          case 'version':
            if (event.version !== value) return false;
            break;
            
          case 'correlationId':
            // Check in metadata or payload
            const correlationId = 
              event.metadata?.correlationId || 
              (event.payload as any)?.correlationId;
            if (correlationId !== value) return false;
            break;
            
          case 'metadata':
            // Check each metadata field
            for (const [metaKey, metaValue] of Object.entries(value as Record<string, any>)) {
              if (event.metadata?.[metaKey] !== metaValue) return false;
            }
            break;
            
          default:
            // Check in payload for custom filters
            if (key.startsWith('payload.')) {
              const payloadKey = key.substring(8);
              if ((event.payload as any)?.[payloadKey] !== value) return false;
            }
            break;
        }
      }
      
      // All filters passed
      return true;
    });
  }
  
  /**
   * Apply sorting to an array of events
   * @param events Array of events to sort
   * @param sort Sort options
   * @returns Sorted array of events
   */
  private applySorting<T extends IBaseEvent>(events: T[], sort: EventSortOptions): T[] {
    const { field, direction } = sort;
    
    return [...events].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Get values based on field path
      if (field.includes('.')) {
        const parts = field.split('.');
        valueA = parts.reduce((obj, key) => obj?.[key], a as any);
        valueB = parts.reduce((obj, key) => obj?.[key], b as any);
      } else {
        valueA = (a as any)[field];
        valueB = (b as any)[field];
      }
      
      // Handle undefined values
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined) return direction === 'asc' ? 1 : -1;
      
      // Compare based on value type
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        // Handle date strings
        if (field === 'timestamp' || valueA.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        } else {
          return direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
      }
      
      // Numeric comparison
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }
  
  /**
   * Group events by specified field(s)
   * @param events Array of events to group
   * @param groupBy Field or fields to group by
   * @returns Object with groups of events
   */
  private groupEvents<T extends IBaseEvent>(events: T[], groupBy: string | string[]): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
    
    for (const event of events) {
      // Generate group key based on groupBy fields
      const groupValues = groupFields.map(field => {
        if (field === 'day') {
          // Special case for grouping by day
          return event.timestamp.substring(0, 10); // YYYY-MM-DD
        }
        
        if (field.includes('.')) {
          // Handle nested fields
          const parts = field.split('.');
          return parts.reduce((obj, key) => obj?.[key], event as any) || 'undefined';
        }
        
        return (event as any)[field] || 'undefined';
      });
      
      const groupKey = groupValues.join('|');
      
      // Initialize group if it doesn't exist
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      // Add event to group
      groups[groupKey].push(event);
    }
    
    return groups;
  }
  
  /**
   * Calculate a metric for a group of events
   * @param events Array of events to calculate metric for
   * @param field Field to calculate metric on
   * @param operation Metric operation to perform
   * @returns Calculated metric value
   */
  private calculateMetric<T extends IBaseEvent>(events: T[], field: string, operation: string): number {
    // Handle count operation separately
    if (operation === 'count') {
      return events.length;
    }
    
    // Extract values for the specified field
    const values = events.map(event => {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        return parts.reduce((obj, key) => obj?.[key], event as any);
      }
      return (event as any)[field];
    }).filter(value => typeof value === 'number');
    
    // Calculate metric based on operation
    switch (operation) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
        
      case 'avg':
        return values.length > 0 
          ? values.reduce((sum, value) => sum + value, 0) / values.length 
          : 0;
        
      case 'min':
        return values.length > 0 
          ? Math.min(...values) 
          : 0;
        
      case 'max':
        return values.length > 0 
          ? Math.max(...values) 
          : 0;
        
      default:
        return 0;
    }
  }
}

/**
 * Factory function to create a pre-populated mock event store for testing
 * @param events Initial events to populate the store with
 * @returns A new MockEventStore instance with the provided events
 */
export function createMockEventStore(events: IBaseEvent[] = []): MockEventStore {
  const store = new MockEventStore();
  
  // Add each event to the store
  for (const event of events) {
    store.storeEvent(event);
  }
  
  return store;
}

/**
 * Create a mock event with required fields
 * @param type Event type
 * @param source Event source
 * @param payload Event payload
 * @param overrides Optional overrides for other fields
 * @returns A mock event object
 */
export function createMockEvent<T = any>(
  type: string,
  source: string,
  payload: T,
  overrides: Partial<IBaseEvent<T>> = {}
): IBaseEvent<T> {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    type,
    source,
    payload,
    ...overrides,
  };
}

/**
 * Create a mock journey event with required fields
 * @param type Event type
 * @param source Event source
 * @param journeyType Journey type
 * @param userId User ID
 * @param payload Event payload
 * @param overrides Optional overrides for other fields
 * @returns A mock journey event object
 */
export function createMockJourneyEvent<T = any>(
  type: string,
  source: string,
  journeyType: JourneyType,
  userId: string,
  payload: T,
  overrides: Partial<IBaseEvent<T>> = {}
): IBaseEvent<T> {
  return createMockEvent(
    type,
    source,
    payload,
    {
      metadata: {
        journey: journeyType,
        userId,
        correlationId: uuidv4(),
        ...(overrides.metadata || {}),
      },
      ...overrides,
    }
  );
}
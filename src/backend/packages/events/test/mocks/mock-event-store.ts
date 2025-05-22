import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing a base event structure
 */
export interface BaseEvent {
  eventId: string;
  type: string;
  timestamp: string | Date;
  source: string;
  version: string;
  userId?: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Options for filtering events
 */
export interface EventFilterOptions {
  type?: string | string[];
  source?: string | string[];
  userId?: string;
  fromTimestamp?: string | Date;
  toTimestamp?: string | Date;
  version?: string;
  metadata?: Record<string, any>;
  payloadQuery?: Record<string, any>;
}

/**
 * Options for sorting events
 */
export interface EventSortOptions {
  field: keyof BaseEvent | string;
  direction: 'asc' | 'desc';
}

/**
 * Options for pagination
 */
export interface EventPaginationOptions {
  skip?: number;
  take?: number;
}

/**
 * Combined query options for events
 */
export interface EventQueryOptions {
  filter?: EventFilterOptions;
  sort?: EventSortOptions[];
  pagination?: EventPaginationOptions;
}

/**
 * Options for aggregation operations
 */
export interface EventAggregationOptions {
  groupBy?: (keyof BaseEvent | string)[];
  operations: {
    field: string;
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    as: string;
  }[];
  filter?: EventFilterOptions;
}

/**
 * Result of an aggregation operation
 */
export interface AggregationResult {
  groups?: Record<string, any>[];
  results: Record<string, any>[];
}

/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
  id: string;
  events: BaseEvent[];
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Interface for the event store
 */
export interface IEventStore {
  saveEvent(event: BaseEvent): Promise<BaseEvent>;
  saveEvents(events: BaseEvent[]): Promise<BaseEvent[]>;
  findEvent(eventId: string): Promise<BaseEvent | null>;
  findEvents(options?: EventQueryOptions): Promise<BaseEvent[]>;
  deleteEvent(eventId: string): Promise<boolean>;
  deleteEvents(options: EventFilterOptions): Promise<number>;
  getEventHistory(userId: string, options?: EventQueryOptions): Promise<BaseEvent[]>;
  aggregate(options: EventAggregationOptions): Promise<AggregationResult>;
  beginTransaction(): Promise<TransactionContext>;
  clear(): Promise<void>;
}

/**
 * In-memory implementation of the event store for testing
 */
export class MockEventStore implements IEventStore {
  private events: Map<string, BaseEvent> = new Map();
  private transactions: Map<string, BaseEvent[]> = new Map();

  /**
   * Saves a single event to the store
   * @param event The event to save
   * @returns The saved event with generated ID if not provided
   */
  async saveEvent(event: BaseEvent): Promise<BaseEvent> {
    const eventToSave = { ...event };
    
    // Generate an ID if not provided
    if (!eventToSave.eventId) {
      eventToSave.eventId = uuidv4();
    }
    
    // Ensure timestamp is in ISO format
    if (eventToSave.timestamp instanceof Date) {
      eventToSave.timestamp = eventToSave.timestamp.toISOString();
    } else if (!eventToSave.timestamp) {
      eventToSave.timestamp = new Date().toISOString();
    }
    
    this.events.set(eventToSave.eventId, eventToSave);
    return eventToSave;
  }

  /**
   * Saves multiple events to the store
   * @param events Array of events to save
   * @returns Array of saved events
   */
  async saveEvents(events: BaseEvent[]): Promise<BaseEvent[]> {
    const savedEvents: BaseEvent[] = [];
    
    for (const event of events) {
      const savedEvent = await this.saveEvent(event);
      savedEvents.push(savedEvent);
    }
    
    return savedEvents;
  }

  /**
   * Finds a single event by ID
   * @param eventId The ID of the event to find
   * @returns The event or null if not found
   */
  async findEvent(eventId: string): Promise<BaseEvent | null> {
    return this.events.get(eventId) || null;
  }

  /**
   * Finds events matching the provided query options
   * @param options Query options for filtering, sorting, and pagination
   * @returns Array of matching events
   */
  async findEvents(options?: EventQueryOptions): Promise<BaseEvent[]> {
    let result = Array.from(this.events.values());
    
    // Apply filtering
    if (options?.filter) {
      result = this.filterEvents(result, options.filter);
    }
    
    // Apply sorting
    if (options?.sort && options.sort.length > 0) {
      result = this.sortEvents(result, options.sort);
    }
    
    // Apply pagination
    if (options?.pagination) {
      const { skip = 0, take } = options.pagination;
      result = result.slice(skip, take ? skip + take : undefined);
    }
    
    return result;
  }

  /**
   * Deletes a single event by ID
   * @param eventId The ID of the event to delete
   * @returns True if the event was deleted, false otherwise
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    return this.events.delete(eventId);
  }

  /**
   * Deletes events matching the provided filter options
   * @param options Filter options to match events for deletion
   * @returns Number of deleted events
   */
  async deleteEvents(options: EventFilterOptions): Promise<number> {
    const eventsToDelete = this.filterEvents(Array.from(this.events.values()), options);
    let count = 0;
    
    for (const event of eventsToDelete) {
      if (this.events.delete(event.eventId)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Gets the event history for a specific user
   * @param userId The user ID to get history for
   * @param options Additional query options
   * @returns Array of events for the user, sorted by timestamp
   */
  async getEventHistory(userId: string, options?: EventQueryOptions): Promise<BaseEvent[]> {
    const filterOptions: EventFilterOptions = {
      userId,
      ...(options?.filter || {})
    };
    
    const queryOptions: EventQueryOptions = {
      filter: filterOptions,
      sort: options?.sort || [{ field: 'timestamp', direction: 'asc' }],
      pagination: options?.pagination
    };
    
    return this.findEvents(queryOptions);
  }

  /**
   * Performs aggregation operations on events
   * @param options Aggregation options
   * @returns Aggregation results
   */
  async aggregate(options: EventAggregationOptions): Promise<AggregationResult> {
    // Get filtered events
    let events = Array.from(this.events.values());
    if (options.filter) {
      events = this.filterEvents(events, options.filter);
    }
    
    // Group events if groupBy is specified
    const groups: Record<string, BaseEvent[]> = {};
    
    if (options.groupBy && options.groupBy.length > 0) {
      for (const event of events) {
        const groupKey = options.groupBy.map(field => {
          if (field.includes('.')) {
            // Handle nested fields (e.g., 'payload.value')
            return this.getNestedValue(event, field);
          }
          return event[field as keyof BaseEvent];
        }).join('|');
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        
        groups[groupKey].push(event);
      }
    } else {
      // If no groupBy, use a single group
      groups['all'] = events;
    }
    
    // Perform aggregation operations
    const results: Record<string, any>[] = [];
    const groupResults: Record<string, any>[] = [];
    
    for (const [groupKey, groupEvents] of Object.entries(groups)) {
      const groupResult: Record<string, any> = {};
      const result: Record<string, any> = {};
      
      // Add group key values to the result if groupBy was specified
      if (options.groupBy && options.groupBy.length > 0) {
        const groupKeyValues = groupKey.split('|');
        options.groupBy.forEach((field, index) => {
          const fieldName = field.includes('.') ? field.split('.').pop()! : field;
          groupResult[fieldName] = groupKeyValues[index];
        });
      }
      
      // Perform each aggregation operation
      for (const op of options.operations) {
        let value: any;
        
        switch (op.operation) {
          case 'count':
            value = groupEvents.length;
            break;
          case 'sum':
            value = groupEvents.reduce((sum, event) => {
              const fieldValue = this.getNestedValue(event, op.field);
              return sum + (typeof fieldValue === 'number' ? fieldValue : 0);
            }, 0);
            break;
          case 'avg':
            const sum = groupEvents.reduce((acc, event) => {
              const fieldValue = this.getNestedValue(event, op.field);
              return acc + (typeof fieldValue === 'number' ? fieldValue : 0);
            }, 0);
            value = groupEvents.length > 0 ? sum / groupEvents.length : 0;
            break;
          case 'min':
            value = groupEvents.reduce((min, event) => {
              const fieldValue = this.getNestedValue(event, op.field);
              return typeof fieldValue === 'number' && (min === null || fieldValue < min) ? fieldValue : min;
            }, null as number | null);
            break;
          case 'max':
            value = groupEvents.reduce((max, event) => {
              const fieldValue = this.getNestedValue(event, op.field);
              return typeof fieldValue === 'number' && (max === null || fieldValue > max) ? fieldValue : max;
            }, null as number | null);
            break;
        }
        
        result[op.as] = value;
      }
      
      // Combine group key values and aggregation results
      results.push({ ...groupResult, ...result });
      if (Object.keys(groupResult).length > 0) {
        groupResults.push(groupResult);
      }
    }
    
    return {
      groups: groupResults.length > 0 ? groupResults : undefined,
      results
    };
  }

  /**
   * Begins a new transaction for atomic operations
   * @returns Transaction context
   */
  async beginTransaction(): Promise<TransactionContext> {
    const transactionId = uuidv4();
    this.transactions.set(transactionId, []);
    
    return {
      id: transactionId,
      events: [],
      commit: async () => {
        const events = this.transactions.get(transactionId) || [];
        await this.saveEvents(events);
        this.transactions.delete(transactionId);
      },
      rollback: async () => {
        this.transactions.delete(transactionId);
      }
    };
  }

  /**
   * Clears all events from the store
   */
  async clear(): Promise<void> {
    this.events.clear();
    this.transactions.clear();
  }

  /**
   * Filters events based on the provided filter options
   * @param events Array of events to filter
   * @param filter Filter options
   * @returns Filtered array of events
   */
  private filterEvents(events: BaseEvent[], filter: EventFilterOptions): BaseEvent[] {
    return events.filter(event => {
      // Check event type
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          if (!filter.type.includes(event.type)) return false;
        } else if (event.type !== filter.type) {
          return false;
        }
      }
      
      // Check event source
      if (filter.source) {
        if (Array.isArray(filter.source)) {
          if (!filter.source.includes(event.source)) return false;
        } else if (event.source !== filter.source) {
          return false;
        }
      }
      
      // Check user ID
      if (filter.userId && event.userId !== filter.userId) {
        return false;
      }
      
      // Check timestamp range
      const eventTime = new Date(event.timestamp).getTime();
      
      if (filter.fromTimestamp) {
        const fromTime = new Date(filter.fromTimestamp).getTime();
        if (eventTime < fromTime) return false;
      }
      
      if (filter.toTimestamp) {
        const toTime = new Date(filter.toTimestamp).getTime();
        if (eventTime > toTime) return false;
      }
      
      // Check version
      if (filter.version && event.version !== filter.version) {
        return false;
      }
      
      // Check metadata
      if (filter.metadata && event.metadata) {
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (event.metadata[key] !== value) return false;
        }
      }
      
      // Check payload query
      if (filter.payloadQuery && event.payload) {
        for (const [key, value] of Object.entries(filter.payloadQuery)) {
          if (this.getNestedValue(event.payload, key) !== value) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Sorts events based on the provided sort options
   * @param events Array of events to sort
   * @param sortOptions Sort options
   * @returns Sorted array of events
   */
  private sortEvents(events: BaseEvent[], sortOptions: EventSortOptions[]): BaseEvent[] {
    return [...events].sort((a, b) => {
      for (const sort of sortOptions) {
        const { field, direction } = sort;
        const aValue = field.includes('.') ? this.getNestedValue(a, field) : a[field as keyof BaseEvent];
        const bValue = field.includes('.') ? this.getNestedValue(b, field) : b[field as keyof BaseEvent];
        
        if (aValue === bValue) continue;
        
        // Handle different types of values
        if (aValue instanceof Date && bValue instanceof Date) {
          return direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return direction === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Default comparison for other types
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr);
        return direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }

  /**
   * Gets a nested value from an object using dot notation
   * @param obj The object to get the value from
   * @param path The path to the value using dot notation (e.g., 'payload.user.id')
   * @returns The value at the specified path or undefined if not found
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }
}
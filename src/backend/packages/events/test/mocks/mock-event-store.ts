import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing a stored event with additional metadata
 */
export interface StoredEvent<T = any> {
  /** Unique identifier for the stored event */
  id: string;
  /** Original event data */
  event: T;
  /** Timestamp when the event was stored */
  storedAt: Date;
  /** Version of the event schema */
  version: string;
  /** Journey this event belongs to (health, care, plan) */
  journey: string;
  /** User ID associated with this event */
  userId: string;
  /** Event type identifier */
  type: string;
  /** Optional correlation ID for distributed tracing */
  correlationId?: string;
  /** Optional transaction ID for grouped operations */
  transactionId?: string;
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
}

/**
 * Interface for event query filters
 */
export interface EventFilter {
  /** Filter by journey name */
  journey?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by event type */
  type?: string | string[];
  /** Filter by time range start */
  fromDate?: Date;
  /** Filter by time range end */
  toDate?: Date;
  /** Filter by correlation ID */
  correlationId?: string;
  /** Filter by transaction ID */
  transactionId?: string;
  /** Filter by version */
  version?: string;
  /** Custom filter function */
  custom?: (event: StoredEvent) => boolean;
}

/**
 * Interface for event query options
 */
export interface EventQueryOptions {
  /** Maximum number of events to return */
  limit?: number;
  /** Number of events to skip */
  offset?: number;
  /** Sort field */
  sortBy?: keyof StoredEvent | string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Include event history */
  includeHistory?: boolean;
}

/**
 * Interface for event aggregation options
 */
export interface EventAggregationOptions {
  /** Field to group by */
  groupBy: keyof StoredEvent | string;
  /** Aggregation function */
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  /** Field to aggregate (for sum, avg, min, max) */
  field?: string;
  /** Additional filters */
  filter?: EventFilter;
}

/**
 * Interface for transaction options
 */
export interface TransactionOptions {
  /** Transaction ID */
  id?: string;
  /** Transaction timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of an event store transaction
 */
export interface TransactionResult {
  /** Transaction ID */
  id: string;
  /** Whether the transaction was successful */
  success: boolean;
  /** Number of events affected */
  affectedEvents: number;
  /** Error message if transaction failed */
  error?: string;
  /** Timestamp when transaction was completed */
  completedAt: Date;
}

/**
 * Event history entry
 */
export interface EventHistoryEntry<T = any> {
  /** Timestamp of the history entry */
  timestamp: Date;
  /** Type of operation */
  operation: 'create' | 'update' | 'delete';
  /** Event data at this point in time */
  data: T;
  /** User who performed the operation */
  performedBy?: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Mock implementation of an event store for testing purposes.
 * Provides an in-memory storage mechanism for events with query, filtering,
 * and aggregation capabilities similar to a database.
 */
export class MockEventStore {
  /** In-memory storage for events */
  private events: Map<string, StoredEvent> = new Map();
  
  /** Event history tracking */
  private eventHistory: Map<string, EventHistoryEntry[]> = new Map();
  
  /** Active transactions */
  private transactions: Map<string, Set<string>> = new Map();
  
  /** Transaction timeouts */
  private transactionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Creates a new instance of MockEventStore
   */
  constructor() {}

  /**
   * Stores an event in the mock store
   * 
   * @param event - The event to store
   * @param options - Additional options for storing the event
   * @returns The stored event with generated ID and metadata
   */
  async storeEvent<T>(event: T, options?: {
    userId?: string;
    journey?: string;
    type?: string;
    version?: string;
    correlationId?: string;
    transactionId?: string;
    metadata?: Record<string, any>;
  }): Promise<StoredEvent<T>> {
    // Extract event properties or use defaults
    const eventData = event as any;
    const id = uuidv4();
    const storedAt = new Date();
    const userId = options?.userId || eventData.userId || 'unknown';
    const journey = options?.journey || eventData.journey || 'unknown';
    const type = options?.type || eventData.type || 'unknown';
    const version = options?.version || eventData.version || '1.0.0';
    const correlationId = options?.correlationId || eventData.correlationId;
    const transactionId = options?.transactionId || eventData.transactionId;
    const metadata = options?.metadata || eventData.metadata || {};

    // Create the stored event
    const storedEvent: StoredEvent<T> = {
      id,
      event,
      storedAt,
      version,
      journey,
      userId,
      type,
      correlationId,
      transactionId,
      metadata
    };

    // If part of a transaction, verify transaction exists
    if (transactionId && !this.transactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} does not exist or has expired`);
    }

    // Store the event
    this.events.set(id, storedEvent);

    // Add to transaction if applicable
    if (transactionId) {
      const transactionEvents = this.transactions.get(transactionId);
      if (transactionEvents) {
        transactionEvents.add(id);
      }
    }

    // Record in history
    this.recordHistory(id, {
      timestamp: storedAt,
      operation: 'create',
      data: { ...storedEvent },
      context: { source: 'storeEvent' }
    });

    return storedEvent;
  }

  /**
   * Retrieves an event by its ID
   * 
   * @param id - The ID of the event to retrieve
   * @param options - Additional options for retrieval
   * @returns The stored event or null if not found
   */
  async getEventById<T>(id: string, options?: {
    includeHistory?: boolean;
  }): Promise<StoredEvent<T> | null> {
    const event = this.events.get(id) as StoredEvent<T> | undefined;
    
    if (!event) {
      return null;
    }

    // Clone to prevent modification of stored event
    const result = { ...event };

    // Include history if requested
    if (options?.includeHistory) {
      (result as any).history = this.eventHistory.get(id) || [];
    }

    return result;
  }

  /**
   * Updates an existing event
   * 
   * @param id - The ID of the event to update
   * @param updates - Partial updates to apply to the event
   * @param options - Additional options for the update
   * @returns The updated event or null if not found
   */
  async updateEvent<T>(id: string, updates: Partial<T>, options?: {
    transactionId?: string;
    performedBy?: string;
  }): Promise<StoredEvent<T> | null> {
    const existingEvent = this.events.get(id) as StoredEvent<T> | undefined;
    
    if (!existingEvent) {
      return null;
    }

    // If part of a transaction, verify transaction exists
    if (options?.transactionId && !this.transactions.has(options.transactionId)) {
      throw new Error(`Transaction ${options.transactionId} does not exist or has expired`);
    }

    // Create updated event by merging with existing
    const updatedEvent: StoredEvent<T> = {
      ...existingEvent,
      event: { ...existingEvent.event as any, ...updates as any },
      transactionId: options?.transactionId || existingEvent.transactionId
    };

    // Store the updated event
    this.events.set(id, updatedEvent);

    // Add to transaction if applicable
    if (options?.transactionId) {
      const transactionEvents = this.transactions.get(options.transactionId);
      if (transactionEvents) {
        transactionEvents.add(id);
      }
    }

    // Record in history
    this.recordHistory(id, {
      timestamp: new Date(),
      operation: 'update',
      data: { ...updatedEvent },
      performedBy: options?.performedBy,
      context: { source: 'updateEvent' }
    });

    return updatedEvent;
  }

  /**
   * Deletes an event by its ID
   * 
   * @param id - The ID of the event to delete
   * @param options - Additional options for deletion
   * @returns True if the event was deleted, false if not found
   */
  async deleteEvent(id: string, options?: {
    transactionId?: string;
    performedBy?: string;
    permanent?: boolean;
  }): Promise<boolean> {
    const existingEvent = this.events.get(id);
    
    if (!existingEvent) {
      return false;
    }

    // If part of a transaction, verify transaction exists
    if (options?.transactionId && !this.transactions.has(options.transactionId)) {
      throw new Error(`Transaction ${options.transactionId} does not exist or has expired`);
    }

    // Record in history before deleting
    this.recordHistory(id, {
      timestamp: new Date(),
      operation: 'delete',
      data: { ...existingEvent },
      performedBy: options?.performedBy,
      context: { source: 'deleteEvent', permanent: options?.permanent }
    });

    // Delete the event
    this.events.delete(id);

    // Add to transaction if applicable
    if (options?.transactionId) {
      const transactionEvents = this.transactions.get(options.transactionId);
      if (transactionEvents) {
        transactionEvents.add(id);
      }
    }

    // If permanent deletion is requested, remove history too
    if (options?.permanent) {
      this.eventHistory.delete(id);
    }

    return true;
  }

  /**
   * Queries events based on filters and options
   * 
   * @param filter - Filters to apply to the query
   * @param options - Query options for sorting, pagination, etc.
   * @returns Array of events matching the query
   */
  async queryEvents<T>(filter?: EventFilter, options?: EventQueryOptions): Promise<StoredEvent<T>[]> {
    // Convert Map to Array for filtering
    let results = Array.from(this.events.values()) as StoredEvent<T>[];

    // Apply filters if provided
    if (filter) {
      results = results.filter(event => {
        // Journey filter
        if (filter.journey && event.journey !== filter.journey) {
          return false;
        }

        // User ID filter
        if (filter.userId && event.userId !== filter.userId) {
          return false;
        }

        // Event type filter
        if (filter.type) {
          if (Array.isArray(filter.type)) {
            if (!filter.type.includes(event.type)) {
              return false;
            }
          } else if (event.type !== filter.type) {
            return false;
          }
        }

        // Date range filter
        if (filter.fromDate && event.storedAt < filter.fromDate) {
          return false;
        }
        if (filter.toDate && event.storedAt > filter.toDate) {
          return false;
        }

        // Correlation ID filter
        if (filter.correlationId && event.correlationId !== filter.correlationId) {
          return false;
        }

        // Transaction ID filter
        if (filter.transactionId && event.transactionId !== filter.transactionId) {
          return false;
        }

        // Version filter
        if (filter.version && event.version !== filter.version) {
          return false;
        }

        // Custom filter function
        if (filter.custom && !filter.custom(event)) {
          return false;
        }

        return true;
      });
    }

    // Apply sorting if provided
    if (options?.sortBy) {
      const sortField = options.sortBy as keyof StoredEvent;
      const sortDirection = options.sortDirection || 'asc';
      
      results.sort((a, b) => {
        // Handle nested properties with dot notation
        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
        };

        const aValue = getNestedValue(a, sortField as string);
        const bValue = getNestedValue(b, sortField as string);

        if (aValue === bValue) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        // Sort based on direction
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      });
    }

    // Apply pagination if provided
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || results.length;
      results = results.slice(offset, offset + limit);
    }

    // Include history if requested
    if (options?.includeHistory) {
      results = results.map(event => {
        const result = { ...event };
        (result as any).history = this.eventHistory.get(event.id) || [];
        return result;
      });
    }

    return results;
  }

  /**
   * Aggregates events based on specified options
   * 
   * @param options - Aggregation options
   * @returns Aggregation results
   */
  async aggregateEvents(options: EventAggregationOptions): Promise<Record<string, any>> {
    // First query events based on filter
    const events = await this.queryEvents(options.filter);

    // Group events by the specified field
    const groups = new Map<string, StoredEvent[]>();
    
    for (const event of events) {
      // Handle nested properties with dot notation
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
      };

      const groupValue = String(getNestedValue(event, options.groupBy as string) || 'null');
      
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(event);
    }

    // Apply aggregation function to each group
    const result: Record<string, any> = {};
    
    for (const [groupValue, groupEvents] of groups.entries()) {
      switch (options.aggregation) {
        case 'count':
          result[groupValue] = groupEvents.length;
          break;
          
        case 'sum':
          if (!options.field) {
            throw new Error('Field must be specified for sum aggregation');
          }
          result[groupValue] = groupEvents.reduce((sum, event) => {
            const value = options.field!.split('.').reduce(
              (o, key) => (o && o[key] !== undefined) ? o[key] : 0, 
              event as any
            );
            return sum + (typeof value === 'number' ? value : 0);
          }, 0);
          break;
          
        case 'avg':
          if (!options.field) {
            throw new Error('Field must be specified for avg aggregation');
          }
          if (groupEvents.length === 0) {
            result[groupValue] = 0;
          } else {
            const sum = groupEvents.reduce((sum, event) => {
              const value = options.field!.split('.').reduce(
                (o, key) => (o && o[key] !== undefined) ? o[key] : 0, 
                event as any
              );
              return sum + (typeof value === 'number' ? value : 0);
            }, 0);
            result[groupValue] = sum / groupEvents.length;
          }
          break;
          
        case 'min':
          if (!options.field) {
            throw new Error('Field must be specified for min aggregation');
          }
          if (groupEvents.length === 0) {
            result[groupValue] = null;
          } else {
            result[groupValue] = groupEvents.reduce((min, event) => {
              const value = options.field!.split('.').reduce(
                (o, key) => (o && o[key] !== undefined) ? o[key] : null, 
                event as any
              );
              if (value === null) return min;
              if (min === null) return value;
              return value < min ? value : min;
            }, null as any);
          }
          break;
          
        case 'max':
          if (!options.field) {
            throw new Error('Field must be specified for max aggregation');
          }
          if (groupEvents.length === 0) {
            result[groupValue] = null;
          } else {
            result[groupValue] = groupEvents.reduce((max, event) => {
              const value = options.field!.split('.').reduce(
                (o, key) => (o && o[key] !== undefined) ? o[key] : null, 
                event as any
              );
              if (value === null) return max;
              if (max === null) return value;
              return value > max ? value : max;
            }, null as any);
          }
          break;
      }
    }

    return result;
  }

  /**
   * Begins a new transaction
   * 
   * @param options - Transaction options
   * @returns Transaction ID
   */
  async beginTransaction(options?: TransactionOptions): Promise<string> {
    const transactionId = options?.id || uuidv4();
    
    // Check if transaction already exists
    if (this.transactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} already exists`);
    }
    
    // Create new transaction
    this.transactions.set(transactionId, new Set());
    
    // Set up transaction timeout if specified
    if (options?.timeout) {
      const timeout = setTimeout(() => {
        this.rollbackTransaction(transactionId)
          .catch(err => console.error(`Error rolling back transaction ${transactionId}:`, err));
      }, options.timeout);
      
      this.transactionTimeouts.set(transactionId, timeout);
    }
    
    return transactionId;
  }

  /**
   * Commits a transaction
   * 
   * @param transactionId - ID of the transaction to commit
   * @returns Result of the transaction
   */
  async commitTransaction(transactionId: string): Promise<TransactionResult> {
    // Check if transaction exists
    if (!this.transactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} does not exist or has expired`);
    }
    
    // Get events in this transaction
    const transactionEvents = this.transactions.get(transactionId)!;
    const affectedEvents = transactionEvents.size;
    
    // Clear transaction timeout if exists
    if (this.transactionTimeouts.has(transactionId)) {
      clearTimeout(this.transactionTimeouts.get(transactionId)!);
      this.transactionTimeouts.delete(transactionId);
    }
    
    // Remove transaction
    this.transactions.delete(transactionId);
    
    return {
      id: transactionId,
      success: true,
      affectedEvents,
      completedAt: new Date()
    };
  }

  /**
   * Rolls back a transaction
   * 
   * @param transactionId - ID of the transaction to roll back
   * @returns Result of the transaction
   */
  async rollbackTransaction(transactionId: string): Promise<TransactionResult> {
    // Check if transaction exists
    if (!this.transactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} does not exist or has expired`);
    }
    
    // Get events in this transaction
    const transactionEvents = this.transactions.get(transactionId)!;
    const affectedEvents = transactionEvents.size;
    
    // For each event in the transaction, restore from history or delete
    for (const eventId of transactionEvents) {
      const history = this.eventHistory.get(eventId) || [];
      
      // Find the last state before this transaction
      const previousState = [...history]
        .reverse()
        .find(entry => entry.context?.source !== 'rollbackTransaction' && 
                      (!entry.data.transactionId || entry.data.transactionId !== transactionId));
      
      if (previousState && previousState.operation !== 'delete') {
        // Restore previous state
        this.events.set(eventId, previousState.data);
        
        // Record rollback in history
        this.recordHistory(eventId, {
          timestamp: new Date(),
          operation: 'update',
          data: previousState.data,
          context: { source: 'rollbackTransaction', transactionId }
        });
      } else {
        // If no previous state or was deleted, delete the event
        this.events.delete(eventId);
        
        // Record rollback deletion in history
        if (history.length > 0) {
          this.recordHistory(eventId, {
            timestamp: new Date(),
            operation: 'delete',
            data: history[0].data,
            context: { source: 'rollbackTransaction', transactionId }
          });
        }
      }
    }
    
    // Clear transaction timeout if exists
    if (this.transactionTimeouts.has(transactionId)) {
      clearTimeout(this.transactionTimeouts.get(transactionId)!);
      this.transactionTimeouts.delete(transactionId);
    }
    
    // Remove transaction
    this.transactions.delete(transactionId);
    
    return {
      id: transactionId,
      success: true,
      affectedEvents,
      completedAt: new Date()
    };
  }

  /**
   * Gets the event history for a specific event
   * 
   * @param eventId - ID of the event
   * @returns Array of history entries
   */
  async getEventHistory<T>(eventId: string): Promise<EventHistoryEntry<T>[]> {
    return (this.eventHistory.get(eventId) || []) as EventHistoryEntry<T>[];
  }

  /**
   * Clears all events from the store
   * 
   * @param options - Options for clearing events
   * @returns Number of events cleared
   */
  async clearEvents(options?: {
    journey?: string;
    preserveHistory?: boolean;
  }): Promise<number> {
    let count = 0;
    
    // If journey is specified, only clear events for that journey
    if (options?.journey) {
      for (const [id, event] of this.events.entries()) {
        if (event.journey === options.journey) {
          this.events.delete(id);
          count++;
          
          if (!options.preserveHistory) {
            this.eventHistory.delete(id);
          }
        }
      }
    } else {
      // Clear all events
      count = this.events.size;
      this.events.clear();
      
      if (!options?.preserveHistory) {
        this.eventHistory.clear();
      }
    }
    
    return count;
  }

  /**
   * Gets the total count of events in the store
   * 
   * @param filter - Optional filter to count specific events
   * @returns Number of events
   */
  async getEventCount(filter?: EventFilter): Promise<number> {
    if (!filter) {
      return this.events.size;
    }
    
    // Use queryEvents with the filter and return the length
    const events = await this.queryEvents(filter);
    return events.length;
  }

  /**
   * Records an entry in the event history
   * 
   * @param eventId - ID of the event
   * @param entry - History entry to record
   */
  private recordHistory(eventId: string, entry: EventHistoryEntry): void {
    if (!this.eventHistory.has(eventId)) {
      this.eventHistory.set(eventId, []);
    }
    
    this.eventHistory.get(eventId)!.push(entry);
  }
}
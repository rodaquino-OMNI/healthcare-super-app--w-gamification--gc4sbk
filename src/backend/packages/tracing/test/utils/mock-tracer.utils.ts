import { LoggerService } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import { JourneyContext } from '../../src/interfaces/journey-context.interface';
import { SpanAttributes } from '../../src/interfaces/span-attributes.interface';
import { SpanOptions } from '../../src/interfaces/span-options.interface';

/**
 * Represents a mock span for testing purposes.
 * Simulates the behavior of an OpenTelemetry span without requiring actual OpenTelemetry infrastructure.
 */
export interface MockSpan {
  /** Unique identifier for the span */
  id: string;
  /** Name of the span */
  name: string;
  /** Timestamp when the span was started */
  startTime: number;
  /** Timestamp when the span was ended, or undefined if still active */
  endTime?: number;
  /** Status of the span (OK, ERROR) */
  status: {
    code: SpanStatusCode;
    message?: string;
  };
  /** Custom attributes attached to the span */
  attributes: Record<string, any>;
  /** Parent span ID if this span has a parent */
  parentId?: string;
  /** Any errors recorded on this span */
  errors: Error[];
  /** Whether the span is still recording */
  isRecording: boolean;
  /** Journey context associated with this span, if any */
  journeyContext?: JourneyContext;
}

/**
 * Configuration options for the MockTracingService
 */
export interface MockTracingServiceOptions {
  /** Service name to use for the tracer */
  serviceName?: string;
  /** Logger service for logging messages */
  logger?: LoggerService;
  /** Whether to automatically generate trace and span IDs */
  autoGenerateIds?: boolean;
  /** Whether to simulate random errors in tracing operations */
  simulateErrors?: boolean;
  /** Error rate (0-1) when simulateErrors is true */
  errorRate?: number;
}

/**
 * A mock implementation of the TracingService for testing purposes.
 * Simulates the behavior of the real TracingService without requiring actual OpenTelemetry infrastructure.
 */
export class MockTracingService {
  private readonly serviceName: string;
  private readonly logger?: LoggerService;
  private readonly autoGenerateIds: boolean;
  private readonly simulateErrors: boolean;
  private readonly errorRate: number;
  
  /** All spans created by this tracer, indexed by span ID */
  public readonly spans: Map<string, MockSpan> = new Map();
  /** Currently active spans, indexed by span ID */
  public readonly activeSpans: Map<string, MockSpan> = new Map();
  /** The current active span ID in this context */
  public currentSpanId?: string;
  /** The current trace ID in this context */
  public currentTraceId: string;

  /**
   * Creates a new instance of the MockTracingService.
   * @param options Configuration options for the mock tracer
   */
  constructor(options: MockTracingServiceOptions = {}) {
    this.serviceName = options.serviceName || 'mock-service';
    this.logger = options.logger;
    this.autoGenerateIds = options.autoGenerateIds !== false;
    this.simulateErrors = options.simulateErrors || false;
    this.errorRate = options.errorRate || 0.1; // 10% error rate by default
    this.currentTraceId = this.generateId('trace');
    
    this.log(`Initialized mock tracer for ${this.serviceName}`);
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @param options Additional options for span creation
   * @returns The result of the function execution
   */
  async createSpan<T>(
    name: string,
    fn: () => Promise<T>,
    options?: SpanOptions
  ): Promise<T> {
    // Create a new span
    const spanId = this.generateId('span');
    const parentId = this.currentSpanId;
    
    const span: MockSpan = {
      id: spanId,
      name,
      startTime: Date.now(),
      status: { code: SpanStatusCode.UNSET },
      attributes: { ...options?.attributes },
      errors: [],
      isRecording: true,
      parentId,
      journeyContext: options?.journeyContext,
    };
    
    // Store the span and set it as the current span
    this.spans.set(spanId, span);
    this.activeSpans.set(spanId, span);
    const previousSpanId = this.currentSpanId;
    this.currentSpanId = spanId;
    
    this.log(`Started span: ${name} (${spanId})`);
    
    try {
      // Simulate random errors if configured
      if (this.simulateErrors && Math.random() < this.errorRate) {
        throw new Error(`Simulated error in span: ${name}`);
      }
      
      // Execute the provided function
      const result = await fn();
      
      // Set the span status to OK if successful
      if (span.isRecording) {
        span.status = { code: SpanStatusCode.OK };
      }
      
      return result;
    } catch (error) {
      // Record the error and set the span status to ERROR
      if (span.isRecording) {
        span.errors.push(error);
        span.status = { 
          code: SpanStatusCode.ERROR,
          message: error.message 
        };
      }
      
      this.log(`Error in span ${name}: ${error.message}`, 'error');
      throw error;
    } finally {
      // End the span and restore the previous span as current
      if (span.isRecording) {
        span.endTime = Date.now();
        span.isRecording = false;
        this.activeSpans.delete(spanId);
      }
      
      this.currentSpanId = previousSpanId;
      this.log(`Ended span: ${name} (${spanId})`);
    }
  }

  /**
   * Adds an attribute to the current span.
   * @param key The attribute key
   * @param value The attribute value
   */
  addAttribute(key: string, value: any): void {
    if (!this.currentSpanId) {
      this.log('Cannot add attribute: No active span', 'warn');
      return;
    }
    
    const span = this.activeSpans.get(this.currentSpanId);
    if (span && span.isRecording) {
      span.attributes[key] = value;
      this.log(`Added attribute to span ${span.name}: ${key}=${value}`);
    }
  }

  /**
   * Adds multiple attributes to the current span.
   * @param attributes The attributes to add
   */
  addAttributes(attributes: SpanAttributes): void {
    if (!this.currentSpanId) {
      this.log('Cannot add attributes: No active span', 'warn');
      return;
    }
    
    const span = this.activeSpans.get(this.currentSpanId);
    if (span && span.isRecording) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.attributes[key] = value;
      });
      this.log(`Added ${Object.keys(attributes).length} attributes to span ${span.name}`);
    }
  }

  /**
   * Sets journey context on the current span.
   * @param journeyContext The journey context to set
   */
  setJourneyContext(journeyContext: JourneyContext): void {
    if (!this.currentSpanId) {
      this.log('Cannot set journey context: No active span', 'warn');
      return;
    }
    
    const span = this.activeSpans.get(this.currentSpanId);
    if (span && span.isRecording) {
      span.journeyContext = journeyContext;
      this.log(`Set journey context on span ${span.name}: ${journeyContext.journeyType}`);
    }
  }

  /**
   * Records an error on the current span.
   * @param error The error to record
   */
  recordError(error: Error): void {
    if (!this.currentSpanId) {
      this.log('Cannot record error: No active span', 'warn');
      return;
    }
    
    const span = this.activeSpans.get(this.currentSpanId);
    if (span && span.isRecording) {
      span.errors.push(error);
      span.status = { 
        code: SpanStatusCode.ERROR,
        message: error.message 
      };
      this.log(`Recorded error on span ${span.name}: ${error.message}`, 'error');
    }
  }

  /**
   * Gets the current correlation ID for logs and metrics.
   * @returns An object containing trace and span IDs for correlation
   */
  getCorrelationIds(): { traceId: string; spanId: string } {
    return {
      traceId: this.currentTraceId,
      spanId: this.currentSpanId || this.generateId('span')
    };
  }

  /**
   * Resets the mock tracer state, clearing all spans and resetting IDs.
   */
  reset(): void {
    this.spans.clear();
    this.activeSpans.clear();
    this.currentSpanId = undefined;
    this.currentTraceId = this.generateId('trace');
    this.log('Reset mock tracer state');
  }

  /**
   * Gets all spans that match the given filter criteria.
   * @param filter Filter criteria for spans
   * @returns Array of matching spans
   */
  getSpans(filter?: {
    name?: string;
    status?: SpanStatusCode;
    hasError?: boolean;
    journeyType?: string;
    attributeKey?: string;
    attributeValue?: any;
  }): MockSpan[] {
    if (!filter) {
      return Array.from(this.spans.values());
    }
    
    return Array.from(this.spans.values()).filter(span => {
      if (filter.name && span.name !== filter.name) return false;
      if (filter.status && span.status.code !== filter.status) return false;
      if (filter.hasError === true && span.errors.length === 0) return false;
      if (filter.hasError === false && span.errors.length > 0) return false;
      if (filter.journeyType && span.journeyContext?.journeyType !== filter.journeyType) return false;
      if (filter.attributeKey && !(filter.attributeKey in span.attributes)) return false;
      if (filter.attributeValue !== undefined && span.attributes[filter.attributeKey] !== filter.attributeValue) return false;
      
      return true;
    });
  }

  /**
   * Gets the duration of a span in milliseconds.
   * @param spanId The ID of the span
   * @returns The duration in milliseconds, or undefined if the span is still active
   */
  getSpanDuration(spanId: string): number | undefined {
    const span = this.spans.get(spanId);
    if (!span || !span.endTime) return undefined;
    return span.endTime - span.startTime;
  }

  /**
   * Generates a unique ID for traces or spans.
   * @param type The type of ID to generate ('trace' or 'span')
   * @returns A unique ID string
   */
  private generateId(type: 'trace' | 'span'): string {
    if (!this.autoGenerateIds) {
      return `mock-${type}-${Date.now()}`;
    }
    
    // Generate a random hex string similar to real trace/span IDs
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Logs a message using the provided logger or console.
   * @param message The message to log
   * @param level The log level
   */
  private log(message: string, level: 'log' | 'error' | 'warn' = 'log'): void {
    const correlationInfo = this.currentSpanId 
      ? `[trace=${this.currentTraceId.substring(0, 8)}...][span=${this.currentSpanId.substring(0, 8)}...]` 
      : `[trace=${this.currentTraceId.substring(0, 8)}...]`;
    
    const formattedMessage = `${correlationInfo} ${message}`;
    
    if (this.logger) {
      switch (level) {
        case 'error':
          this.logger.error(formattedMessage);
          break;
        case 'warn':
          this.logger.warn(formattedMessage);
          break;
        default:
          this.logger.log(formattedMessage);
      }
    } else {
      console[level](formattedMessage);
    }
  }
}

/**
 * Creates a configured instance of MockTracingService for testing.
 * @param options Configuration options for the mock tracer
 * @returns A configured MockTracingService instance
 */
export function createMockTracer(options: MockTracingServiceOptions = {}): MockTracingService {
  return new MockTracingService(options);
}

/**
 * Creates a mock span for testing with predefined values.
 * @param overrides Properties to override in the default mock span
 * @returns A mock span object
 */
export function createMockSpan(overrides: Partial<MockSpan> = {}): MockSpan {
  const defaultSpan: MockSpan = {
    id: `mock-span-${Date.now()}`,
    name: 'mock-operation',
    startTime: Date.now() - 100, // Started 100ms ago
    endTime: Date.now(),
    status: { code: SpanStatusCode.OK },
    attributes: {},
    errors: [],
    isRecording: false,
  };
  
  return { ...defaultSpan, ...overrides };
}

/**
 * Creates a mock journey context for testing.
 * @param journeyType The type of journey ('health', 'care', or 'plan')
 * @param userId The user ID associated with the journey
 * @param additionalContext Additional context properties
 * @returns A journey context object
 */
export function createMockJourneyContext(
  journeyType: 'health' | 'care' | 'plan',
  userId: string,
  additionalContext: Record<string, any> = {}
): JourneyContext {
  const baseContext: JourneyContext = {
    journeyType,
    userId,
    timestamp: Date.now(),
  };
  
  // Add journey-specific properties based on journey type
  switch (journeyType) {
    case 'health':
      return {
        ...baseContext,
        metricType: 'steps',
        deviceId: 'mock-device-123',
        ...additionalContext,
      };
    case 'care':
      return {
        ...baseContext,
        appointmentId: 'mock-appointment-123',
        providerId: 'mock-provider-123',
        ...additionalContext,
      };
    case 'plan':
      return {
        ...baseContext,
        planId: 'mock-plan-123',
        benefitId: 'mock-benefit-123',
        ...additionalContext,
      };
    default:
      return { ...baseContext, ...additionalContext };
  }
}
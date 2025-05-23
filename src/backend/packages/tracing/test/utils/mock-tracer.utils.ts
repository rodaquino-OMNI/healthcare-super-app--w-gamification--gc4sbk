import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Context,
  Span,
  SpanContext,
  SpanKind,
  SpanStatusCode,
  TraceFlags,
} from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

import {
  DEFAULT_LOGGER_CONTEXT,
  DEFAULT_SERVICE_NAME,
  TRACING_SERVICE_NAME_KEY,
} from '../../src/constants/defaults';
import {
  JourneyContext,
  SpanOptions,
  TraceContextCarrier,
} from '../../src/interfaces';
import { TracingService } from '../../src/tracing.service';

/**
 * Interface for a mock span used in testing
 */
export interface MockSpan extends Span {
  /** Name of the span */
  name: string;
  /** Attributes added to the span */
  attributes: Record<string, unknown>;
  /** Events added to the span */
  events: Array<{ name: string; attributes?: Record<string, unknown> }>;
  /** Status of the span */
  status: { code: SpanStatusCode; message?: string };
  /** Whether the span is recording */
  recording: boolean;
  /** Whether the span has ended */
  ended: boolean;
  /** Exceptions recorded on the span */
  exceptions: Error[];
  /** Start time of the span */
  startTime: number;
  /** End time of the span */
  endTime?: number;
  /** Parent span ID */
  parentSpanId?: string;
  /** Span ID */
  spanId: string;
  /** Trace ID */
  traceId: string;
  /** Journey context associated with the span */
  journeyContext?: JourneyContext;
  /** Kind of span */
  kind: SpanKind;
}

/**
 * Options for configuring the MockTracingService
 */
export interface MockTracingServiceOptions {
  /** Service name to use for the tracer */
  serviceName?: string;
  /** Whether to auto-generate span IDs */
  autoGenerateIds?: boolean;
  /** Whether to simulate errors in tracing operations */
  simulateErrors?: boolean;
  /** Default journey context to use for spans */
  defaultJourneyContext?: JourneyContext;
  /** Mock logger to use for logging */
  mockLogger?: LoggerService;
  /** Mock config service to use for configuration */
  mockConfigService?: ConfigService;
}

/**
 * A mock implementation of TracingService for unit testing.
 * Provides span tracking and inspection capabilities without requiring
 * actual OpenTelemetry infrastructure.
 */
export class MockTracingService extends TracingService {
  /** All spans created by this tracer */
  public readonly spans: MockSpan[] = [];
  /** Currently active spans */
  public readonly activeSpans: Map<string, MockSpan> = new Map();
  /** Service name used by this tracer */
  public readonly serviceName: string;
  /** Whether to auto-generate span IDs */
  private readonly autoGenerateIds: boolean;
  /** Whether to simulate errors in tracing operations */
  private readonly simulateErrors: boolean;
  /** Default journey context to use for spans */
  private readonly defaultJourneyContext?: JourneyContext;
  /** Mock logger for logging */
  private readonly mockLogger: LoggerService;
  /** Current active span ID */
  private currentSpanId?: string;
  /** Root context for trace extraction/injection */
  private readonly rootContext: Context = {} as Context;

  /**
   * Creates a new MockTracingService instance
   * @param options Configuration options for the mock tracer
   */
  constructor(options: MockTracingServiceOptions = {}) {
    // Create mock config service if not provided
    const mockConfigService =
      options.mockConfigService ||
      ({
        get: (key: string, defaultValue?: string) => {
          if (key === TRACING_SERVICE_NAME_KEY) {
            return options.serviceName || defaultValue || DEFAULT_SERVICE_NAME;
          }
          return defaultValue;
        },
      } as ConfigService);

    // Create mock logger if not provided
    const mockLogger =
      options.mockLogger ||
      ({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      } as unknown as LoggerService);

    super(mockConfigService, mockLogger);

    this.serviceName = options.serviceName || DEFAULT_SERVICE_NAME;
    this.autoGenerateIds = options.autoGenerateIds !== false;
    this.simulateErrors = options.simulateErrors === true;
    this.defaultJourneyContext = options.defaultJourneyContext;
    this.mockLogger = mockLogger;
  }

  /**
   * Resets the mock tracer state, clearing all spans and active spans
   */
  reset(): void {
    this.spans.length = 0;
    this.activeSpans.clear();
    this.currentSpanId = undefined;
  }

  /**
   * Creates and starts a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @param options Optional configuration for the span
   * @returns The result of the function execution
   */
  async createSpan<T>(
    name: string,
    fn: () => Promise<T>,
    options?: SpanOptions,
  ): Promise<T> {
    // Simulate errors if configured
    if (this.simulateErrors) {
      this.mockLogger.error(
        `Simulated error in createSpan ${name}`,
        new Error('Simulated error').stack,
        DEFAULT_LOGGER_CONTEXT,
      );
      throw new Error(`Simulated error in createSpan ${name}`);
    }

    const span = this.startSpan(name, options) as MockSpan;
    this.currentSpanId = span.spanId;

    try {
      const result = await fn();
      span.status = { code: SpanStatusCode.OK };
      return result;
    } catch (error) {
      span.status = { code: SpanStatusCode.ERROR, message: error.message };
      span.exceptions.push(error);
      this.mockLogger.error(
        `Error in span ${name}: ${error.message}`,
        error.stack,
        DEFAULT_LOGGER_CONTEXT,
      );
      throw error;
    } finally {
      this.endSpan(span.spanId);
      this.currentSpanId = span.parentSpanId;
    }
  }

  /**
   * Gets the current active span from the context.
   * @returns The current span or undefined if no span is active
   */
  getCurrentSpan(): MockSpan | undefined {
    if (!this.currentSpanId) return undefined;
    return this.activeSpans.get(this.currentSpanId);
  }

  /**
   * Creates a new span as a child of the current span.
   * @param name The name of the span to create
   * @param options Optional configuration for the span
   * @returns The newly created span
   */
  startSpan(name: string, options?: SpanOptions): MockSpan {
    const traceId = this.autoGenerateIds ? uuidv4().replace(/-/g, '') : 'mock-trace-id';
    const spanId = this.autoGenerateIds ? uuidv4().replace(/-/g, '').substring(0, 16) : `mock-span-${this.spans.length + 1}`;
    
    const span: MockSpan = {
      name,
      attributes: { ...options?.attributes },
      events: [],
      status: { code: SpanStatusCode.UNSET },
      recording: true,
      ended: false,
      exceptions: [],
      startTime: Date.now(),
      spanId,
      traceId,
      parentSpanId: this.currentSpanId,
      journeyContext: options?.journeyContext || this.defaultJourneyContext,
      kind: options?.kind || SpanKind.INTERNAL,

      // Implement Span interface methods
      setAttribute: (key: string, value: unknown) => {
        span.attributes[key] = value;
        return span;
      },
      setAttributes: (attributes: Record<string, unknown>) => {
        Object.assign(span.attributes, attributes);
        return span;
      },
      addEvent: (name: string, attributes?: Record<string, unknown>) => {
        span.events.push({ name, attributes });
        return span;
      },
      setStatus: (status: { code: SpanStatusCode; message?: string }) => {
        span.status = status;
        return span;
      },
      updateName: (name: string) => {
        span.name = name;
        return span;
      },
      end: (endTime?: number) => {
        span.ended = true;
        span.recording = false;
        span.endTime = endTime || Date.now();
        this.activeSpans.delete(span.spanId);
      },
      isRecording: () => span.recording,
      recordException: (exception: Error) => {
        span.exceptions.push(exception);
        return span;
      },
      spanContext: () => ({
        traceId: span.traceId,
        spanId: span.spanId,
        traceFlags: TraceFlags.SAMPLED,
        isRemote: false,
      }),
    };

    this.spans.push(span);
    this.activeSpans.set(span.spanId, span);

    // Add common attributes
    span.setAttribute('service.name', this.serviceName);
    span.setAttribute('span.name', name);

    // Add journey-specific attributes if provided
    if (span.journeyContext) {
      this.addJourneyAttributes(span, span.journeyContext);
    }

    return span;
  }

  /**
   * Ends a span with the given ID
   * @param spanId The ID of the span to end
   */
  endSpan(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.end();
    }
  }

  /**
   * Extracts trace context from carrier object (e.g., HTTP headers).
   * @param carrier The carrier object containing the trace context
   * @returns The extracted context or ROOT_CONTEXT if extraction fails
   */
  extractContext(carrier: TraceContextCarrier): Context {
    // In the mock implementation, we just return the root context
    // but we could enhance this to actually extract context from headers
    return this.rootContext;
  }

  /**
   * Injects the current trace context into a carrier object (e.g., HTTP headers).
   * @param carrier The carrier object to inject the trace context into
   */
  injectContext(carrier: TraceContextCarrier): void {
    const span = this.getCurrentSpan();
    if (span) {
      // Simulate injecting trace context into headers
      carrier['traceparent'] = `00-${span.traceId}-${span.spanId}-01`;
    }
  }

  /**
   * Creates a correlation ID for linking traces, logs, and metrics.
   * If a trace is active, uses the trace ID, otherwise generates a new UUID.
   * @returns A correlation ID string
   */
  getCorrelationId(): string {
    const span = this.getCurrentSpan();
    if (span) {
      return span.traceId;
    }
    return this.autoGenerateIds ? uuidv4() : 'mock-correlation-id';
  }

  /**
   * Gets correlation information from the current trace context.
   * @returns An object containing trace ID, span ID, and trace flags
   */
  getCorrelationInfo(): Record<string, string> {
    const span = this.getCurrentSpan();
    if (span) {
      return {
        'trace-id': span.traceId,
        'span-id': span.spanId,
        'trace-flags': '01',
      };
    }
    return {
      'trace-id': this.autoGenerateIds ? uuidv4().replace(/-/g, '') : 'mock-trace-id',
      'span-id': this.autoGenerateIds ? uuidv4().replace(/-/g, '').substring(0, 16) : 'mock-span-id',
      'trace-flags': '01',
    };
  }

  /**
   * Annotates the current span with journey-specific context.
   * @param journeyContext The journey context to add to the span
   */
  setJourneyContext(journeyContext: JourneyContext): void {
    const span = this.getCurrentSpan();
    if (span && span.recording) {
      this.addJourneyAttributes(span, journeyContext);
      span.journeyContext = journeyContext;
    }
  }

  /**
   * Adds journey-specific attributes to a span
   * @param span The span to add attributes to
   * @param journeyContext The journey context to add
   */
  private addJourneyAttributes(span: MockSpan, journeyContext: JourneyContext): void {
    // Add journey type
    span.setAttribute('journey.type', journeyContext.type);

    // Add user information if available
    if (journeyContext.userId) {
      span.setAttribute('user.id', journeyContext.userId);
    }

    // Add journey-specific attributes based on journey type
    switch (journeyContext.type) {
      case 'health':
        if (journeyContext.healthMetricId) {
          span.setAttribute('health.metric.id', journeyContext.healthMetricId);
        }
        if (journeyContext.deviceId) {
          span.setAttribute('health.device.id', journeyContext.deviceId);
        }
        if (journeyContext.goalId) {
          span.setAttribute('health.goal.id', journeyContext.goalId);
        }
        break;

      case 'care':
        if (journeyContext.appointmentId) {
          span.setAttribute('care.appointment.id', journeyContext.appointmentId);
        }
        if (journeyContext.providerId) {
          span.setAttribute('care.provider.id', journeyContext.providerId);
        }
        if (journeyContext.medicationId) {
          span.setAttribute('care.medication.id', journeyContext.medicationId);
        }
        break;

      case 'plan':
        if (journeyContext.planId) {
          span.setAttribute('plan.id', journeyContext.planId);
        }
        if (journeyContext.benefitId) {
          span.setAttribute('plan.benefit.id', journeyContext.benefitId);
        }
        if (journeyContext.claimId) {
          span.setAttribute('plan.claim.id', journeyContext.claimId);
        }
        break;

      case 'gamification':
        if (journeyContext.achievementId) {
          span.setAttribute('gamification.achievement.id', journeyContext.achievementId);
        }
        if (journeyContext.questId) {
          span.setAttribute('gamification.quest.id', journeyContext.questId);
        }
        if (journeyContext.rewardId) {
          span.setAttribute('gamification.reward.id', journeyContext.rewardId);
        }
        break;
    }
  }

  /**
   * Annotates the current span with an event.
   * @param name The name of the event
   * @param attributes Optional attributes for the event
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    const span = this.getCurrentSpan();
    if (span && span.recording) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Annotates the current span with custom attributes.
   * @param attributes The attributes to add to the span
   */
  setAttributes(attributes: Record<string, unknown>): void {
    const span = this.getCurrentSpan();
    if (span && span.recording) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Creates a new trace context with the given trace ID and span ID.
   * Useful for testing and manual context creation.
   * @param traceId The trace ID to use
   * @param spanId The span ID to use
   * @returns A new span context
   */
  createSpanContext(traceId: string, spanId: string): SpanContext {
    return {
      traceId,
      spanId,
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
    };
  }

  /**
   * Finds spans by name in the recorded spans
   * @param name The name of the spans to find
   * @returns An array of matching spans
   */
  findSpansByName(name: string): MockSpan[] {
    return this.spans.filter((span) => span.name === name);
  }

  /**
   * Finds spans by attribute in the recorded spans
   * @param key The attribute key to match
   * @param value The attribute value to match
   * @returns An array of matching spans
   */
  findSpansByAttribute(key: string, value: unknown): MockSpan[] {
    return this.spans.filter((span) => span.attributes[key] === value);
  }

  /**
   * Finds spans by journey type in the recorded spans
   * @param journeyType The journey type to match
   * @returns An array of matching spans
   */
  findSpansByJourneyType(journeyType: string): MockSpan[] {
    return this.spans.filter(
      (span) => span.journeyContext?.type === journeyType,
    );
  }

  /**
   * Finds spans with errors in the recorded spans
   * @returns An array of spans with error status
   */
  findErrorSpans(): MockSpan[] {
    return this.spans.filter(
      (span) => span.status.code === SpanStatusCode.ERROR,
    );
  }

  /**
   * Gets the child spans of a given span
   * @param parentSpanId The ID of the parent span
   * @returns An array of child spans
   */
  getChildSpans(parentSpanId: string): MockSpan[] {
    return this.spans.filter((span) => span.parentSpanId === parentSpanId);
  }

  /**
   * Gets the duration of a span in milliseconds
   * @param span The span to get the duration for
   * @returns The duration in milliseconds, or undefined if the span hasn't ended
   */
  getSpanDuration(span: MockSpan): number | undefined {
    if (!span.endTime) return undefined;
    return span.endTime - span.startTime;
  }

  /**
   * Creates a mock health journey context
   * @param options Options for the health journey context
   * @returns A health journey context
   */
  createHealthJourneyContext(options: {
    userId?: string;
    healthMetricId?: string;
    deviceId?: string;
    goalId?: string;
  } = {}): JourneyContext {
    return {
      type: 'health',
      userId: options.userId || 'mock-user-id',
      healthMetricId: options.healthMetricId,
      deviceId: options.deviceId,
      goalId: options.goalId,
    };
  }

  /**
   * Creates a mock care journey context
   * @param options Options for the care journey context
   * @returns A care journey context
   */
  createCareJourneyContext(options: {
    userId?: string;
    appointmentId?: string;
    providerId?: string;
    medicationId?: string;
  } = {}): JourneyContext {
    return {
      type: 'care',
      userId: options.userId || 'mock-user-id',
      appointmentId: options.appointmentId,
      providerId: options.providerId,
      medicationId: options.medicationId,
    };
  }

  /**
   * Creates a mock plan journey context
   * @param options Options for the plan journey context
   * @returns A plan journey context
   */
  createPlanJourneyContext(options: {
    userId?: string;
    planId?: string;
    benefitId?: string;
    claimId?: string;
  } = {}): JourneyContext {
    return {
      type: 'plan',
      userId: options.userId || 'mock-user-id',
      planId: options.planId,
      benefitId: options.benefitId,
      claimId: options.claimId,
    };
  }

  /**
   * Creates a mock gamification journey context
   * @param options Options for the gamification journey context
   * @returns A gamification journey context
   */
  createGamificationJourneyContext(options: {
    userId?: string;
    achievementId?: string;
    questId?: string;
    rewardId?: string;
  } = {}): JourneyContext {
    return {
      type: 'gamification',
      userId: options.userId || 'mock-user-id',
      achievementId: options.achievementId,
      questId: options.questId,
      rewardId: options.rewardId,
    };
  }
}

/**
 * Creates a mock logger service for testing
 * @returns A mock logger service
 */
export function createMockLoggerService(): LoggerService {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as LoggerService;
}

/**
 * Creates a mock config service for testing
 * @param config Optional configuration values
 * @returns A mock config service
 */
export function createMockConfigService(
  config: Record<string, unknown> = {},
): ConfigService {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  } as unknown as ConfigService;
}

/**
 * Creates a mock tracing service for testing
 * @param options Options for the mock tracing service
 * @returns A mock tracing service
 */
export function createMockTracingService(
  options: MockTracingServiceOptions = {},
): MockTracingService {
  return new MockTracingService(options);
}

/**
 * Helper function to create a test span for assertions
 * @param tracer The mock tracer to use
 * @param name The name of the span
 * @param options Optional configuration for the span
 * @returns The created span
 */
export function createTestSpan(
  tracer: MockTracingService,
  name: string,
  options?: SpanOptions,
): MockSpan {
  const span = tracer.startSpan(name, options);
  return span as MockSpan;
}

/**
 * Helper function to execute a function within a test span
 * @param tracer The mock tracer to use
 * @param name The name of the span
 * @param fn The function to execute
 * @param options Optional configuration for the span
 * @returns The result of the function
 */
export async function executeWithTestSpan<T>(
  tracer: MockTracingService,
  name: string,
  fn: () => Promise<T>,
  options?: SpanOptions,
): Promise<T> {
  return tracer.createSpan(name, fn, options);
}
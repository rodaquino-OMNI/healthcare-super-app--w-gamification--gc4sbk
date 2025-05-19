import { INestApplication, LoggerService, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor, InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import * as request from 'supertest';
import { JourneyContext } from '../../src/interfaces/journey-context.interface';

/**
 * Mock logger service for testing that doesn't output to console
 */
export class TestLoggerService implements LoggerService {
  log(message: string): void {}
  error(message: string, trace?: string): void {}
  warn(message: string): void {}
  debug(message: string): void {}
  verbose(message: string): void {}
}

/**
 * Configuration for a test service
 */
export interface TestServiceConfig {
  /** Name of the service */
  name: string;
  /** Port to run the service on */
  port: number;
  /** Optional journey name if this is a journey-specific service */
  journey?: 'health' | 'care' | 'plan';
  /** Additional modules to import */
  imports?: Type<any>[];
  /** Additional providers to register */
  providers?: any[];
  /** Additional controllers to register */
  controllers?: Type<any>[];
}

/**
 * Represents a test service with its NestJS application and tracing service
 */
export interface TestService {
  /** The NestJS application instance */
  app: INestApplication;
  /** The tracing service instance */
  tracingService: TracingService;
  /** The service configuration */
  config: TestServiceConfig;
  /** Base URL for making requests to this service */
  baseUrl: string;
}

/**
 * In-memory span exporter for capturing traces during tests
 */
export const inMemorySpanExporter = new InMemorySpanExporter();

/**
 * OpenTelemetry SDK instance for testing
 */
let otelSdk: NodeSDK;

/**
 * Initializes the OpenTelemetry SDK for testing
 * @returns The initialized SDK instance
 */
export function initTestTracing(): NodeSDK {
  if (otelSdk) {
    return otelSdk;
  }

  // Create a new SDK instance with in-memory exporter
  otelSdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'test-tracing',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      'environment': 'test',
    }),
    spanProcessor: new SimpleSpanProcessor(inMemorySpanExporter),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
    ],
  });

  // Start the SDK
  otelSdk.start();

  // Register shutdown handler
  process.on('SIGTERM', () => {
    otelSdk.shutdown()
      .then(() => console.log('Test tracing SDK shut down successfully'))
      .catch((err) => console.error('Error shutting down test tracing SDK', err))
      .finally(() => process.exit(0));
  });

  return otelSdk;
}

/**
 * Creates a test NestJS application with tracing enabled
 * @param config Configuration for the test service
 * @returns A promise resolving to the test service
 */
export async function createTestService(config: TestServiceConfig): Promise<TestService> {
  // Initialize tracing SDK if not already initialized
  initTestTracing();

  // Create test module with TracingModule and ConfigModule
  const moduleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          service: {
            name: config.name,
            version: '1.0.0',
          },
          journey: config.journey,
        })],
      }),
      TracingModule,
      ...(config.imports || []),
    ],
    controllers: config.controllers || [],
    providers: [
      {
        provide: LoggerService,
        useClass: TestLoggerService,
      },
      ...(config.providers || []),
    ],
  });

  // Create and initialize the test module
  const moduleRef: TestingModule = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(config.port);

  // Get the tracing service from the application
  const tracingService = app.get<TracingService>(TracingService);

  return {
    app,
    tracingService,
    config,
    baseUrl: `http://localhost:${config.port}`,
  };
}

/**
 * Creates multiple test services with tracing enabled
 * @param configs Array of configurations for test services
 * @returns A promise resolving to an array of test services
 */
export async function createTestServices(configs: TestServiceConfig[]): Promise<TestService[]> {
  // Initialize tracing SDK
  initTestTracing();

  // Create all test services
  const services = await Promise.all(
    configs.map(config => createTestService(config))
  );

  return services;
}

/**
 * Makes an HTTP request from one service to another with trace context propagation
 * @param fromService The service making the request
 * @param toService The service receiving the request
 * @param path The path to request on the target service
 * @param method The HTTP method to use (default: 'GET')
 * @param body Optional request body for POST/PUT requests
 * @returns The HTTP response
 */
export async function makeTracedRequest(
  fromService: TestService,
  toService: TestService,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<request.Response> {
  // Create empty headers object
  const headers: Record<string, string> = {};
  
  // Inject trace context into headers
  fromService.tracingService.injectTraceContextIntoHeaders(headers);

  // Make the request with the propagated context
  let req = request(toService.baseUrl)[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](path);
  
  // Add headers to the request
  Object.entries(headers).forEach(([key, value]) => {
    req = req.set(key, value);
  });

  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    req = req.send(body);
  }

  return req;
}

/**
 * Makes a journey-specific HTTP request with appropriate context
 * @param fromService The service making the request
 * @param toService The service receiving the request
 * @param path The path to request on the target service
 * @param journeyContext Journey-specific context to include
 * @param method The HTTP method to use (default: 'GET')
 * @param body Optional request body for POST/PUT requests
 * @returns The HTTP response
 */
export async function makeJourneyRequest(
  fromService: TestService,
  toService: TestService,
  path: string,
  journeyContext: JourneyContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<request.Response> {
  // Create empty headers object
  const headers: Record<string, string> = {};
  
  // Inject trace context into headers
  fromService.tracingService.injectTraceContextIntoHeaders(headers);
  
  // Add journey context to headers
  if (journeyContext.userId) {
    headers['x-user-id'] = journeyContext.userId;
  }
  
  if (journeyContext.requestId) {
    headers['x-request-id'] = journeyContext.requestId;
  }
  
  // Add journey-specific headers
  if ('healthMetricId' in journeyContext) {
    headers['x-health-metric-id'] = journeyContext.healthMetricId;
  } else if ('appointmentId' in journeyContext) {
    headers['x-appointment-id'] = journeyContext.appointmentId;
  } else if ('planId' in journeyContext) {
    headers['x-plan-id'] = journeyContext.planId;
  }

  // Make the request with the propagated context
  let req = request(toService.baseUrl)[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](path);
  
  // Add headers to the request
  Object.entries(headers).forEach(([key, value]) => {
    req = req.set(key, value);
  });

  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    req = req.send(body);
  }

  return req;
}

/**
 * Clears all captured spans from the in-memory exporter
 */
export function clearExportedSpans(): void {
  inMemorySpanExporter.reset();
}

/**
 * Gets all spans that have been captured by the in-memory exporter
 * @returns Array of captured spans
 */
export function getExportedSpans() {
  return inMemorySpanExporter.getFinishedSpans();
}

/**
 * Finds spans matching the given name
 * @param name The span name to search for
 * @returns Array of matching spans
 */
export function findSpansByName(name: string) {
  return getExportedSpans().filter(span => span.name === name);
}

/**
 * Finds spans matching the given attribute key and value
 * @param key The attribute key to match
 * @param value The attribute value to match
 * @returns Array of matching spans
 */
export function findSpansByAttribute(key: string, value: any) {
  return getExportedSpans().filter(span => {
    const attributes = span.attributes || {};
    return attributes[key] === value;
  });
}

/**
 * Finds journey-specific spans
 * @param journeyName The journey name to filter by
 * @param operationName Optional operation name to further filter
 * @returns Array of matching spans
 */
export function findJourneySpans(journeyName: 'health' | 'care' | 'plan', operationName?: string) {
  return getExportedSpans().filter(span => {
    const attributes = span.attributes || {};
    const isJourneySpan = attributes['journey.name'] === journeyName;
    
    if (!operationName) {
      return isJourneySpan;
    }
    
    return isJourneySpan && attributes['journey.operation'] === operationName;
  });
}

/**
 * Shuts down all test services and the tracing SDK
 * @param services Array of test services to shut down
 */
export async function shutdownTestServices(services: TestService[]): Promise<void> {
  // Shut down all NestJS applications
  await Promise.all(services.map(service => service.app.close()));
  
  // Shut down the OpenTelemetry SDK
  if (otelSdk) {
    await otelSdk.shutdown();
    otelSdk = undefined as any;
  }
  
  // Clear all exported spans
  clearExportedSpans();
}
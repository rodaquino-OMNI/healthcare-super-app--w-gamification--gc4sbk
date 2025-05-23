import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { JourneyContext } from '../../src/interfaces';

/**
 * Configuration options for test services
 */
export interface TestServiceConfig {
  /** Name of the service */
  name: string;
  /** Port the service will listen on */
  port: number;
  /** Additional NestJS module imports */
  imports?: ModuleMetadata['imports'];
  /** Additional NestJS module providers */
  providers?: ModuleMetadata['providers'];
  /** Additional NestJS module controllers */
  controllers?: ModuleMetadata['controllers'];
}

/**
 * Configuration for a multi-service test environment
 */
export interface TestEnvironmentConfig {
  /** Configuration for each test service */
  services: TestServiceConfig[];
  /** Whether to use a real tracer (true) or a no-op tracer (false) */
  useRealTracer?: boolean;
}

/**
 * Represents a running test service with its application and tracing service
 */
export interface TestService {
  /** The name of the service */
  name: string;
  /** The port the service is listening on */
  port: number;
  /** The NestJS application instance */
  app: INestApplication;
  /** The tracing service instance */
  tracingService: TracingService;
  /** HTTP service for making requests to other services */
  httpService: HttpService;
}

/**
 * Represents a multi-service test environment
 */
export interface TestEnvironment {
  /** Map of service name to TestService */
  services: Map<string, TestService>;
  /** In-memory span exporter for collecting and analyzing traces */
  spanExporter: InMemorySpanExporter;
  /** Tracer provider instance */
  tracerProvider: NodeTracerProvider;
  /** Clean up the test environment */
  cleanup: () => Promise<void>;
}

/**
 * Creates a mock config service that provides service-specific configuration
 * @param serviceName The name of the service
 * @returns A mock config service
 */
function createMockConfigService(serviceName: string): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === 'TRACING_SERVICE_NAME') {
        return serviceName;
      }
      if (key === 'NODE_ENV') {
        return 'test';
      }
      return undefined;
    }),
  } as unknown as ConfigService;
}

/**
 * Creates a mock logger service for testing
 * @returns A mock logger service
 */
function createMockLoggerService() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
}

/**
 * Sets up an in-memory tracer provider for collecting spans during tests
 * @param useRealTracer Whether to use a real tracer or a no-op tracer
 * @returns The tracer provider and span exporter
 */
export function setupTracerProvider(useRealTracer = true): { 
  tracerProvider: NodeTracerProvider; 
  spanExporter: InMemorySpanExporter;
} {
  // Create an in-memory span exporter for collecting spans
  const spanExporter = new InMemorySpanExporter();
  
  // Create a tracer provider with a resource that identifies our test environment
  const tracerProvider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'austa-test',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
    }),
  });
  
  // Add a span processor that will send spans to our exporter
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
  
  // Register the tracer provider globally
  tracerProvider.register();
  
  return { tracerProvider, spanExporter };
}

/**
 * Creates a test NestJS application with the TracingModule
 * @param config Configuration for the test service
 * @returns A promise that resolves to the test service
 */
export async function createTestService(config: TestServiceConfig): Promise<TestService> {
  // Create a mock config service that provides the service name
  const mockConfigService = createMockConfigService(config.name);
  const mockLoggerService = createMockLoggerService();
  
  // Create a test module with the TracingModule and any additional imports/providers/controllers
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      TracingModule,
      ConfigModule,
      ...(config.imports || []),
    ],
    providers: [
      { provide: ConfigService, useValue: mockConfigService },
      { provide: 'LOGGER_SERVICE', useValue: mockLoggerService },
      ...(config.providers || []),
    ],
    controllers: config.controllers || [],
  }).compile();
  
  // Create a NestJS application from the module
  const app = moduleRef.createNestApplication();
  
  // Get the tracing service from the module
  const tracingService = moduleRef.get<TracingService>(TracingService);
  
  // Get the HTTP service from the module, or create one if not provided
  let httpService: HttpService;
  try {
    httpService = moduleRef.get<HttpService>(HttpService);
  } catch (error) {
    // If HttpService is not provided, create a new one
    const { HttpModule } = await import('@nestjs/axios');
    const httpModuleRef = await Test.createTestingModule({
      imports: [HttpModule],
    }).compile();
    httpService = httpModuleRef.get<HttpService>(HttpService);
  }
  
  // Initialize the application and listen on the specified port
  await app.init();
  await app.listen(config.port);
  
  return {
    name: config.name,
    port: config.port,
    app,
    tracingService,
    httpService,
  };
}

/**
 * Sets up a multi-service test environment with tracing enabled
 * @param config Configuration for the test environment
 * @returns A promise that resolves to the test environment
 */
export async function setupTestEnvironment(config: TestEnvironmentConfig): Promise<TestEnvironment> {
  // Set up the tracer provider and span exporter
  const { tracerProvider, spanExporter } = setupTracerProvider(config.useRealTracer);
  
  // Create a map to store the test services
  const services = new Map<string, TestService>();
  
  // Create each test service
  for (const serviceConfig of config.services) {
    const service = await createTestService(serviceConfig);
    services.set(service.name, service);
  }
  
  // Return the test environment with a cleanup function
  return {
    services,
    spanExporter,
    tracerProvider,
    cleanup: async () => {
      // Close all NestJS applications
      for (const service of services.values()) {
        await service.app.close();
      }
      
      // Clear all collected spans
      spanExporter.reset();
      
      // Shutdown the tracer provider
      await tracerProvider.shutdown();
    },
  };
}

/**
 * Makes an HTTP request from one service to another with trace context propagation
 * @param fromService The service making the request
 * @param toService The service receiving the request
 * @param path The path to request on the target service
 * @param method The HTTP method to use
 * @param data The data to send with the request (for POST, PUT, etc.)
 * @param journeyContext Optional journey context to add to the span
 * @returns A promise that resolves to the response
 */
export async function makeTracedRequest<T = any>(
  fromService: TestService,
  toService: TestService,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  journeyContext?: JourneyContext,
): Promise<AxiosResponse<T>> {
  // Create a span for the request
  return fromService.tracingService.createSpan(
    `${method} ${toService.name}${path}`,
    async () => {
      // Create headers object for trace context propagation
      const headers: Record<string, string> = {};
      
      // Inject the current trace context into the headers
      fromService.tracingService.injectContext(headers);
      
      // Add journey context to the span if provided
      if (journeyContext) {
        fromService.tracingService.setJourneyContext(journeyContext);
      }
      
      // Make the request with the trace context headers
      const url = `http://localhost:${toService.port}${path}`;
      let response: AxiosResponse<T>;
      
      switch (method) {
        case 'GET':
          response = await firstValueFrom(
            fromService.httpService.get<T>(url, { headers })
          );
          break;
        case 'POST':
          response = await firstValueFrom(
            fromService.httpService.post<T>(url, data, { headers })
          );
          break;
        case 'PUT':
          response = await firstValueFrom(
            fromService.httpService.put<T>(url, data, { headers })
          );
          break;
        case 'DELETE':
          response = await firstValueFrom(
            fromService.httpService.delete<T>(url, { headers })
          );
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      return response;
    },
    {
      kind: trace.SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': `http://localhost:${toService.port}${path}`,
        'peer.service': toService.name,
      },
      journeyContext,
    },
  );
}

/**
 * Makes a chain of HTTP requests through multiple services with trace context propagation
 * @param services An array of services to chain requests through
 * @param path The path to request on each service
 * @param journeyContext Optional journey context to add to the spans
 * @returns A promise that resolves to the final response
 */
export async function makeChainedRequest<T = any>(
  services: TestService[],
  path: string,
  journeyContext?: JourneyContext,
): Promise<AxiosResponse<T>> {
  if (services.length < 2) {
    throw new Error('Chain requires at least 2 services');
  }
  
  let response: AxiosResponse<any>;
  
  // Start with the first service making a request to the second
  response = await makeTracedRequest(
    services[0],
    services[1],
    `${path}?target=${services.length > 2 ? services[2].name : 'none'}`,
    'GET',
    undefined,
    journeyContext,
  );
  
  // If there are more services in the chain, continue making requests
  for (let i = 1; i < services.length - 1; i++) {
    response = await makeTracedRequest(
      services[i],
      services[i + 1],
      `${path}?target=${i + 2 < services.length ? services[i + 2].name : 'none'}`,
      'GET',
      undefined,
      journeyContext,
    );
  }
  
  return response as AxiosResponse<T>;
}

/**
 * Finds spans in the collected spans that match the given filter
 * @param spanExporter The span exporter containing collected spans
 * @param filter A function that returns true for spans that match the filter
 * @returns An array of matching spans
 */
export function findSpans(
  spanExporter: InMemorySpanExporter,
  filter: (span: Span) => boolean,
): Span[] {
  return spanExporter.getFinishedSpans()
    .filter(filter);
}

/**
 * Finds spans in the collected spans that belong to a specific service
 * @param spanExporter The span exporter containing collected spans
 * @param serviceName The name of the service to find spans for
 * @returns An array of spans belonging to the service
 */
export function findServiceSpans(
  spanExporter: InMemorySpanExporter,
  serviceName: string,
): Span[] {
  return findSpans(
    spanExporter,
    (span) => {
      const attributes = span.attributes || {};
      return attributes['service.name'] === serviceName;
    },
  );
}

/**
 * Finds spans in the collected spans that have a specific journey context
 * @param spanExporter The span exporter containing collected spans
 * @param journeyType The type of journey to find spans for
 * @returns An array of spans with the specified journey context
 */
export function findJourneySpans(
  spanExporter: InMemorySpanExporter,
  journeyType: 'health' | 'care' | 'plan',
): Span[] {
  return findSpans(
    spanExporter,
    (span) => {
      const attributes = span.attributes || {};
      return attributes['journey.type'] === journeyType;
    },
  );
}

/**
 * Waits for all spans to be exported and processed
 * @returns A promise that resolves when all spans are exported
 */
export async function waitForSpanExport(): Promise<void> {
  // This is a simple delay to ensure all spans are exported
  // In a real implementation, you might want to poll the exporter
  // until all expected spans are received
  return new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Clears all collected spans from the span exporter
 * @param spanExporter The span exporter to clear
 */
export function clearSpans(spanExporter: InMemorySpanExporter): void {
  spanExporter.reset();
}
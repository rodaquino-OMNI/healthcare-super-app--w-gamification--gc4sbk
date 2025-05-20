import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { TracingCollector } from './tracing-collector';
import * as request from 'supertest';
import { Server } from 'http';
import { AddressInfo } from 'net';

/**
 * Configuration options for a test service in the tracing e2e test environment.
 */
export interface TestServiceConfig {
  /** Name of the service */
  name: string;
  
  /** Port to run the service on (optional, will use random port if not specified) */
  port?: number;
  
  /** Additional modules to import into the service */
  imports?: Array<Type<any> | ModuleMetadata | DynamicModule>;
  
  /** Additional providers to register with the service */
  providers?: any[];
  
  /** Additional controllers to register with the service */
  controllers?: any[];
  
  /** Journey type for this service (optional) */
  journeyType?: 'health' | 'care' | 'plan';
  
  /** Environment variables to set for this service */
  env?: Record<string, string>;
}

/**
 * Represents a running test service in the tracing e2e test environment.
 */
export interface RunningTestService {
  /** Name of the service */
  name: string;
  
  /** The NestJS application instance */
  app: INestApplication;
  
  /** The HTTP server instance */
  server: Server;
  
  /** The base URL for making requests to this service */
  url: string;
  
  /** The port the service is running on */
  port: number;
  
  /** The TracingService instance for this service */
  tracingService: TracingService;
  
  /** Journey type for this service (if specified) */
  journeyType?: 'health' | 'care' | 'plan';
  
  /** Make an HTTP request to another service with trace context propagation */
  makeRequest(options: {
    /** Target service to send request to */
    targetService: RunningTestService;
    /** HTTP method */
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    /** Path on the target service */
    path: string;
    /** Request body (for POST, PUT, PATCH) */
    body?: any;
    /** Additional headers */
    headers?: Record<string, string>;
  }): Promise<request.Response>;
}

/**
 * Interface for a dynamic module that can be imported into a NestJS application.
 */
interface DynamicModule extends ModuleMetadata {
  module: Type<any>;
}

/**
 * TracingTestEnvironment provides utilities for setting up and managing a multi-service
 * test environment for end-to-end testing of distributed tracing functionality.
 * 
 * This class helps create multiple interconnected NestJS applications that represent
 * different microservices, configure them with the TracingModule, establish HTTP
 * connections between them, and verify trace context propagation across service boundaries.
 */
export class TracingTestEnvironment {
  private services: Map<string, RunningTestService> = new Map();
  private collector: TracingCollector;
  private isInitialized = false;

  /**
   * Creates a new TracingTestEnvironment instance.
   * @param useBatchProcessor Whether to use BatchSpanProcessor (true) or SimpleSpanProcessor (false)
   */
  constructor(useBatchProcessor = false) {
    this.collector = new TracingCollector(useBatchProcessor);
  }

  /**
   * Initializes the tracing test environment.
   * This must be called before creating any test services.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.collector.initialize();
    this.isInitialized = true;
  }

  /**
   * Creates and starts a test service with the specified configuration.
   * @param config Configuration for the test service
   * @returns A RunningTestService instance representing the started service
   */
  async createTestService(config: TestServiceConfig): Promise<RunningTestService> {
    if (!this.isInitialized) {
      throw new Error('TracingTestEnvironment must be initialized before creating services');
    }

    // Set up environment variables for the service
    const env = {
      SERVICE_NAME: config.name,
      ...(config.env || {}),
    };

    // Create a ConfigService with the environment variables
    const configService = {
      get: (key: string, defaultValue?: any) => env[key] || defaultValue,
    } as ConfigService;

    // Create the module metadata for the test service
    const moduleMetadata: ModuleMetadata = {
      imports: [
        TracingModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => env],
        }),
        ...(config.imports || []),
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: configService,
        },
        ...(config.providers || []),
      ],
      controllers: [...(config.controllers || [])],
    };

    // Create the test module
    const moduleRef: TestingModule = await Test.createTestingModule(moduleMetadata).compile();

    // Create the NestJS application
    const app = moduleRef.createNestApplication();
    await app.init();

    // Start the HTTP server
    const server = await app.getHttpAdapter().getInstance().listen(config.port || 0);
    const address = server.address() as AddressInfo;
    const port = address.port;
    const url = `http://localhost:${port}`;

    // Get the TracingService instance
    const tracingService = app.get(TracingService);

    // Create the RunningTestService object
    const runningService: RunningTestService = {
      name: config.name,
      app,
      server,
      url,
      port,
      tracingService,
      journeyType: config.journeyType,

      // Method to make requests to other services with trace context propagation
      async makeRequest({ targetService, method, path, body, headers = {} }) {
        // Inject trace context into headers
        const headersWithContext = tracingService.injectContextIntoHeaders(headers);

        // Make the request to the target service
        let req = request(targetService.url)[method](path);

        // Add headers
        Object.entries(headersWithContext).forEach(([key, value]) => {
          if (typeof value === 'string') {
            req = req.set(key, value);
          } else if (Array.isArray(value)) {
            value.forEach(v => {
              req = req.set(key, v);
            });
          }
        });

        // Add body if provided
        if (body && ['post', 'put', 'patch'].includes(method)) {
          req = req.send(body);
        }

        // Send the request
        return req;
      },
    };

    // Store the service in the map
    this.services.set(config.name, runningService);

    return runningService;
  }

  /**
   * Creates multiple test services with the specified configurations.
   * @param configs Array of configurations for the test services
   * @returns A map of service names to RunningTestService instances
   */
  async createTestServices(configs: TestServiceConfig[]): Promise<Map<string, RunningTestService>> {
    for (const config of configs) {
      await this.createTestService(config);
    }
    return this.services;
  }

  /**
   * Gets a test service by name.
   * @param name The name of the service to get
   * @returns The RunningTestService instance, or undefined if not found
   */
  getService(name: string): RunningTestService | undefined {
    return this.services.get(name);
  }

  /**
   * Gets all test services.
   * @returns A map of service names to RunningTestService instances
   */
  getServices(): Map<string, RunningTestService> {
    return this.services;
  }

  /**
   * Gets the tracing collector instance.
   * @returns The TracingCollector instance
   */
  getCollector(): TracingCollector {
    return this.collector;
  }

  /**
   * Shuts down all test services and the tracing collector.
   */
  async shutdown(): Promise<void> {
    // Shutdown all services
    for (const service of this.services.values()) {
      await new Promise<void>((resolve) => {
        service.server.close(() => resolve());
      });
      await service.app.close();
    }

    // Clear the services map
    this.services.clear();

    // Shutdown the collector
    await this.collector.shutdown();
    this.isInitialized = false;
  }

  /**
   * Resets the tracing collector, clearing all collected spans.
   */
  resetCollector(): void {
    this.collector.reset();
  }

  /**
   * Creates a test environment with a chain of services that call each other.
   * This is useful for testing trace context propagation across multiple services.
   * 
   * @param serviceConfigs Array of configurations for the services in the chain
   * @param chainEndpoints Object mapping service names to endpoint configurations
   * @returns A map of service names to RunningTestService instances
   */
  async createServiceChain(
    serviceConfigs: TestServiceConfig[],
    chainEndpoints: Record<string, {
      /** Path for the endpoint that will call the next service */
      path: string;
      /** HTTP method for the endpoint */
      method: 'get' | 'post' | 'put' | 'delete' | 'patch';
      /** Name of the next service to call (omit for the last service in the chain) */
      nextService?: string;
      /** Path on the next service to call */
      nextPath?: string;
      /** HTTP method to use when calling the next service */
      nextMethod?: 'get' | 'post' | 'put' | 'delete' | 'patch';
      /** Controller to handle the endpoint */
      controller: any;
    }>
  ): Promise<Map<string, RunningTestService>> {
    // Create all services
    await this.createTestServices(serviceConfigs);

    // Configure chain endpoints
    for (const [serviceName, endpointConfig] of Object.entries(chainEndpoints)) {
      const service = this.getService(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      // If this is not the last service in the chain, ensure nextService is specified
      if (endpointConfig.nextService) {
        const nextService = this.getService(endpointConfig.nextService);
        if (!nextService) {
          throw new Error(`Next service ${endpointConfig.nextService} not found`);
        }
      }
    }

    return this.services;
  }

  /**
   * Creates a test environment with services representing different journeys.
   * This is useful for testing trace context propagation across journey boundaries.
   * 
   * @param journeyServices Configuration for services representing different journeys
   * @returns A map of service names to RunningTestService instances
   */
  async createJourneyServices(
    journeyServices: {
      health?: TestServiceConfig;
      care?: TestServiceConfig;
      plan?: TestServiceConfig;
      shared?: TestServiceConfig[];
    }
  ): Promise<{
    health?: RunningTestService;
    care?: RunningTestService;
    plan?: RunningTestService;
    shared: RunningTestService[];
  }> {
    const result: {
      health?: RunningTestService;
      care?: RunningTestService;
      plan?: RunningTestService;
      shared: RunningTestService[];
    } = {
      shared: [],
    };

    // Create health journey service if specified
    if (journeyServices.health) {
      const config = journeyServices.health;
      config.journeyType = 'health';
      result.health = await this.createTestService(config);
    }

    // Create care journey service if specified
    if (journeyServices.care) {
      const config = journeyServices.care;
      config.journeyType = 'care';
      result.care = await this.createTestService(config);
    }

    // Create plan journey service if specified
    if (journeyServices.plan) {
      const config = journeyServices.plan;
      config.journeyType = 'plan';
      result.plan = await this.createTestService(config);
    }

    // Create shared services if specified
    if (journeyServices.shared) {
      for (const config of journeyServices.shared) {
        const service = await this.createTestService(config);
        result.shared.push(service);
      }
    }

    return result;
  }

  /**
   * Executes a multi-service test scenario and verifies trace context propagation.
   * 
   * @param scenario Function that executes the test scenario
   * @param verifyTraces Function that verifies the collected traces
   * @returns The result of the verification function
   */
  async executeScenario<T>(
    scenario: () => Promise<void>,
    verifyTraces: (collector: TracingCollector) => Promise<T>
  ): Promise<T> {
    // Reset the collector before running the scenario
    this.resetCollector();

    // Execute the scenario
    await scenario();

    // Wait for spans to be exported
    await this.collector.waitForSpans();

    // Verify the traces
    return verifyTraces(this.collector);
  }
}

/**
 * Creates a controller class that handles requests and optionally forwards them to another service.
 * This is useful for creating test controllers for the service chain.
 * 
 * @param options Configuration for the controller
 * @returns A controller class that can be used with NestJS
 */
export function createChainController(options: {
  /** Path for the endpoint */
  path: string;
  /** HTTP method for the endpoint */
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  /** Function to handle the request */
  handler?: (req: any, tracingService: TracingService) => Promise<any>;
  /** Name of the next service to call (optional) */
  nextService?: string;
  /** Path on the next service to call (optional) */
  nextPath?: string;
  /** HTTP method to use when calling the next service (optional) */
  nextMethod?: 'get' | 'post' | 'put' | 'delete' | 'patch';
}): any {
  const { path, method, handler, nextService, nextPath, nextMethod } = options;

  // Create a dynamic controller class
  class ChainController {
    constructor(private readonly tracingService: TracingService) {}

    async handleRequest(req: any): Promise<any> {
      // If a custom handler is provided, use it
      if (handler) {
        return handler(req, this.tracingService);
      }

      // Default implementation just returns a success message
      return { success: true, service: req.service };
    }
  }

  // Add the method decorator to the handleRequest method
  Reflect.defineMetadata(
    'path',
    path,
    ChainController.prototype.handleRequest
  );
  Reflect.defineMetadata(
    'method',
    method,
    ChainController.prototype.handleRequest
  );

  return ChainController;
}

/**
 * Creates a simple controller for testing tracing functionality.
 * 
 * @param basePath Base path for the controller's endpoints
 * @returns A controller class that can be used with NestJS
 */
export function createTestController(basePath = ''): any {
  class TestController {
    constructor(private readonly tracingService: TracingService) {}

    async getHello(req: any): Promise<any> {
      return { message: 'Hello World!' };
    }

    async postData(req: any, body: any): Promise<any> {
      return { received: body };
    }

    async createSpan(req: any, body: any): Promise<any> {
      return this.tracingService.createSpan('test-span', async () => {
        return { message: 'Span created' };
      }, {
        attributes: body,
      });
    }

    async createJourneySpan(req: any, body: any): Promise<any> {
      const { journeyType, operationName, ...attributes } = body;
      return this.tracingService.createJourneySpan(
        journeyType,
        operationName,
        async () => {
          return { message: 'Journey span created' };
        },
        { attributes }
      );
    }

    async error(req: any): Promise<any> {
      throw new Error('Test error');
    }
  }

  // Add method decorators
  Reflect.defineMetadata(
    'path',
    `${basePath}/hello`,
    TestController.prototype.getHello
  );
  Reflect.defineMetadata(
    'method',
    'get',
    TestController.prototype.getHello
  );

  Reflect.defineMetadata(
    'path',
    `${basePath}/data`,
    TestController.prototype.postData
  );
  Reflect.defineMetadata(
    'method',
    'post',
    TestController.prototype.postData
  );

  Reflect.defineMetadata(
    'path',
    `${basePath}/span`,
    TestController.prototype.createSpan
  );
  Reflect.defineMetadata(
    'method',
    'post',
    TestController.prototype.createSpan
  );

  Reflect.defineMetadata(
    'path',
    `${basePath}/journey-span`,
    TestController.prototype.createJourneySpan
  );
  Reflect.defineMetadata(
    'method',
    'post',
    TestController.prototype.createJourneySpan
  );

  Reflect.defineMetadata(
    'path',
    `${basePath}/error`,
    TestController.prototype.error
  );
  Reflect.defineMetadata(
    'method',
    'get',
    TestController.prototype.error
  );

  return TestController;
}
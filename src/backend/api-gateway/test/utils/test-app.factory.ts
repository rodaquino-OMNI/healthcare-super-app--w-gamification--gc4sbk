import { INestApplication, ModuleMetadata, Type, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// Import from standardized path aliases
import { AppModule } from '@app/api-gateway/src/app.module';
import { LoggingMiddleware } from '@app/api-gateway/src/middleware/logging.middleware';
import { AuthMiddleware } from '@app/api-gateway/src/middleware/auth.middleware';
import { resolvers } from '@app/api-gateway/src/graphql/resolvers';
import configuration from '@app/api-gateway/src/config/configuration';

// Import from @austa packages
import { ErrorsModule, CircuitBreakerInterceptor, RetryInterceptor, FallbackInterceptor } from '@austa/errors/nest';
import { CircuitBreakerUtil } from '@austa/errors/utils';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ApiErrorTypes } from '@austa/interfaces/api/error.types';
import { IUserResponse, IJwtPayload } from '@austa/interfaces/auth';

/**
 * Configuration options for creating a test application.
 */
export interface TestAppOptions {
  /**
   * Whether to apply the standard middleware (auth, logging).
   * @default true
   */
  applyMiddleware?: boolean;

  /**
   * Whether to enable error handling with the ErrorsModule.
   * @default true
   */
  enableErrorHandling?: boolean;

  /**
   * Whether to enable GraphQL for the test application.
   * @default false
   */
  enableGraphQL?: boolean;

  /**
   * GraphQL configuration options.
   */
  graphQLOptions?: Partial<ApolloDriverConfig>;

  /**
   * Whether to enable circuit breaker patterns for the test application.
   * @default false
   */
  enableCircuitBreaker?: boolean;

  /**
   * Whether to enable retry interceptor for the test application.
   * @default false
   */
  enableRetryInterceptor?: boolean;

  /**
   * Whether to enable global validation pipes.
   * @default true
   */
  enableValidation?: boolean;

  /**
   * Additional providers to include in the test module.
   */
  providers?: any[];

  /**
   * Additional imports to include in the test module.
   */
  imports?: any[];

  /**
   * Additional controllers to include in the test module.
   */
  controllers?: any[];

  /**
   * Custom logger service to use for test logging.
   * If not provided, a mock logger will be used.
   */
  logger?: LoggerService;

  /**
   * Custom tracing service to use for test tracing.
   * If not provided, a mock tracing service will be used.
   */
  tracer?: TracingService;

  /**
   * Mock user for authentication in tests.
   * If provided, the auth middleware will use this user instead of validating tokens.
   */
  mockUser?: IUserResponse;

  /**
   * Environment variables to use for the test application.
   */
  env?: Record<string, string>;
}

/**
 * Result of creating a test application.
 */
export interface TestAppResult {
  /**
   * The NestJS application instance.
   */
  app: INestApplication;

  /**
   * The testing module used to create the application.
   */
  module: TestingModule;

  /**
   * Function to close the application and clean up resources.
   */
  cleanup: () => Promise<void>;
}

/**
 * Creates a mock logger service for testing.
 */
function createMockLogger(): LoggerService {
  return {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as LoggerService;
}

/**
 * Creates a mock tracing service for testing.
 */
function createMockTracer(): TracingService {
  return {
    createSpan: jest.fn().mockImplementation((name, options, fn) => {
      return Promise.resolve(fn(null));
    }),
    addAttributesToCurrentSpan: jest.fn(),
  } as unknown as TracingService;
}

/**
 * Creates a test JWT token for authentication in tests.
 * 
 * @param payload The JWT payload to include in the token
 * @param secret The secret to use for signing the token (defaults to 'test-secret')
 * @returns A signed JWT token
 */
export function createTestJwtToken(payload: Partial<IJwtPayload>, secret: string = 'test-secret'): string {
  const jwtService = new JwtService({
    secret,
    signOptions: { expiresIn: '1h' },
  });

  const defaultPayload: IJwtPayload = {
    sub: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    roles: ['user'],
    permissions: [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: '00000000-0000-0000-0000-000000000000',
  };

  return jwtService.sign({ ...defaultPayload, ...payload });
}

/**
 * Creates a mock user for authentication in tests.
 * 
 * @param overrides Properties to override in the default user
 * @returns A mock user object
 */
export function createMockUser(overrides: Partial<IUserResponse> = {}): IUserResponse {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    permissions: [],
    journeyPreferences: {
      health: { enabled: true },
      care: { enabled: true },
      plan: { enabled: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock circuit breaker for testing.
 * 
 * @param serviceName The name of the service to create a circuit breaker for
 * @param options Circuit breaker options
 * @returns A mock circuit breaker
 */
export function createMockCircuitBreaker<T>(serviceName: string, mockResponse?: T): CircuitBreakerUtil {
  return {
    execute: jest.fn().mockImplementation(async (fn) => {
      if (mockResponse !== undefined) {
        return mockResponse;
      }
      return fn();
    }),
    getState: jest.fn().mockReturnValue('CLOSED'),
    reset: jest.fn(),
  } as unknown as CircuitBreakerUtil;
}
}

/**
 * Factory function to create a standardized NestJS test application for E2E tests.
 * 
 * This utility streamlines the app initialization process by abstracting the repetitive
 * test module configuration, application initialization, and cleanup processes.
 * 
 * Features:
 * - Standardized middleware configuration
 * - Proper module resolution with path aliases (@app/shared, @austa/*)
 * - Enhanced error handling for test application initialization
 * - Consistent cleanup process
 * - Support for custom providers and imports
 * - GraphQL testing support
 * - Circuit breaker and retry pattern integration
 * - Mock authentication for protected endpoints
 * 
 * @param rootModule The root module to use for the test application (defaults to AppModule)
 * @param options Configuration options for the test application
 * @returns A TestAppResult containing the application, module, and cleanup function
 * 
 * @example
 * // Basic usage with default AppModule
 * const { app, cleanup } = await createTestingApp();
 * 
 * // Make a request to the API
 * const response = await request(app.getHttpServer())
 *   .get('/some-endpoint')
 *   .expect(200);
 * 
 * // After tests
 * await cleanup();
 * 
 * @example
 * // Custom module with additional providers
 * const { app, cleanup } = await createTestingApp(CustomModule, {
 *   providers: [MockService],
 *   applyMiddleware: false
 * });
 * 
 * @example
 * // Testing with GraphQL
 * const { app, cleanup } = await createTestingApp(AppModule, {
 *   enableGraphQL: true,
 *   graphQLOptions: {
 *     playground: true, // Enable playground for testing
 *   }
 * });
 * 
 * // Execute a GraphQL query
 * const query = `
 *   query {
 *     users {
 *       id
 *       name
 *     }
 *   }
 * `;
 * 
 * const response = await request(app.getHttpServer())
 *   .post('/graphql')
 *   .send({ query })
 *   .expect(200);
 * 
 * @example
 * // Testing with authentication
 * const mockUser = createMockUser({
 *   id: 'test-user-id',
 *   roles: ['admin']
 * });
 * 
 * const { app, cleanup } = await createTestingApp(AppModule, {
 *   mockUser,
 * });
 * 
 * // Access a protected endpoint without providing a token
 * const response = await request(app.getHttpServer())
 *   .get('/protected-endpoint')
 *   .expect(200);
 * 
 * @example
 * // Testing with circuit breaker and retry patterns
 * const { app, cleanup } = await createTestingApp(AppModule, {
 *   enableCircuitBreaker: true,
 *   enableRetryInterceptor: true,
 * });
 * 
 * @example
 * // Testing with environment variables
 * const { app, cleanup } = await createTestingApp(AppModule, {
 *   env: {
 *     NODE_ENV: 'test',
 *     API_KEY: 'test-api-key',
 *   },
 * });
 */
export async function createTestingApp(
  rootModule: Type<any> = AppModule,
  options: TestAppOptions = {}
): Promise<TestAppResult> {
  // Set default options
  const {
    applyMiddleware = true,
    enableErrorHandling = true,
    enableGraphQL = false,
    graphQLOptions = {},
    enableCircuitBreaker = false,
    enableRetryInterceptor = false,
    enableValidation = true,
    providers = [],
    imports = [],
    controllers = [],
    logger = createMockLogger(),
    tracer = createMockTracer(),
    mockUser = null,
    env = {},
  } = options;

  try {
    // Set environment variables for testing
    Object.entries(env).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Create module metadata with proper configuration
    const moduleMetadata: ModuleMetadata = {
      imports: [
        // Add ConfigModule for environment variables
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        
        // Add GraphQL module if enabled
        ...(enableGraphQL ? [
          GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true, // In-memory schema for tests
            sortSchema: true,
            playground: false,
            debug: false,
            resolvers,
            formatError: (error) => {
              const formattedError: ApiErrorTypes.GraphQLErrorResponse = {
                message: error.message,
                code: error.extensions?.code || 'INTERNAL_ERROR',
                path: error.path,
                context: error.extensions?.context || {},
              };
              return formattedError;
            },
            context: ({ req }) => ({ req }),
            ...graphQLOptions,
          }),
        ] : []),
        
        // Add ErrorsModule if error handling is enabled
        ...(enableErrorHandling ? [
          ErrorsModule.forRoot({
            enableGlobalFilters: true,
            enableRetryInterceptor,
            enableCircuitBreaker,
            fallbackStrategies: {
              default: 'cache',
            },
          }),
        ] : []),
        
        // Add root module and additional imports
        rootModule,
        ...imports,
      ],
      controllers: [...controllers],
      providers: [
        ...providers,
        // Provide mock or custom logger and tracer
        {
          provide: LoggerService,
          useValue: logger,
        },
        {
          provide: TracingService,
          useValue: tracer,
        },
        // Add mock JWT service if needed
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => createTestJwtToken(payload)),
            verify: jest.fn().mockImplementation((token) => {
              try {
                const parts = token.split('.');
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                return payload;
              } catch (e) {
                throw new Error('Invalid token');
              }
            }),
          },
        },
      ],
    };

    // Create and compile the test module
    const moduleFixture = await Test.createTestingModule(moduleMetadata).compile();

    // Override AuthMiddleware if mockUser is provided
    if (mockUser) {
      const authMiddleware = moduleFixture.get<AuthMiddleware>(AuthMiddleware);
      jest.spyOn(authMiddleware, 'use').mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
    }

    // Create the NestJS application
    const app = moduleFixture.createNestApplication();

    // Apply global validation pipe if enabled
    if (enableValidation) {
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          validationError: {
            target: false,
            value: false,
          },
        }),
      );
    }

    // Apply global interceptors if enabled
    if (enableCircuitBreaker) {
      app.useGlobalInterceptors(new CircuitBreakerInterceptor());
    }

    if (enableRetryInterceptor) {
      app.useGlobalInterceptors(new RetryInterceptor());
      app.useGlobalInterceptors(new FallbackInterceptor());
    }

    // Apply middleware if enabled
    if (applyMiddleware) {
      try {
        const authMiddleware = app.get(AuthMiddleware);
        const loggingMiddleware = app.get(LoggingMiddleware);

        app.use(authMiddleware.use.bind(authMiddleware));
        app.use(loggingMiddleware.use.bind(loggingMiddleware));
      } catch (error) {
        logger.warn(`Could not apply middleware: ${error.message}`);
        // Continue without middleware if not available
      }
    }

    // Initialize the application
    await app.init();

    // Create cleanup function
    const cleanup = async (): Promise<void> => {
      try {
        await app.close();
        
        // Reset environment variables
        Object.keys(env).forEach((key) => {
          delete process.env[key];
        });
        
        // Reset all mocks
        jest.resetAllMocks();
      } catch (error) {
        logger.error(`Error during test app cleanup: ${error.message}`, error.stack);
      }
    };

    return { app, module: moduleFixture, cleanup };
  } catch (error) {
    // Handle initialization errors
    const errorMessage = `Failed to create test application: ${error.message}`;
    logger.error(errorMessage, error.stack);
    
    // Reset environment variables on error
    Object.keys(env).forEach((key) => {
      delete process.env[key];
    });
    
    // Rethrow with enhanced context
    throw new Error(errorMessage);
  }
}

/**
 * Creates a standardized NestJS test application with retry logic for E2E tests.
 * 
 * This function adds retry capability to the createTestingApp function to handle
 * transient failures during test application initialization.
 * 
 * @param rootModule The root module to use for the test application
 * @param options Configuration options for the test application
 * @param retryOptions Retry options (maxRetries and delay)
 * @returns A TestAppResult containing the application, module, and cleanup function
 * 
 * @example
 * // With retry options
 * const { app, cleanup } = await createTestingAppWithRetry(AppModule, {}, {
 *   maxRetries: 3,
 *   delay: 1000
 * });
 */
export async function createTestingAppWithRetry(
  rootModule: Type<any> = AppModule,
  options: TestAppOptions = {},
  retryOptions: { maxRetries: number; delay: number } = { maxRetries: 3, delay: 500 }
): Promise<TestAppResult> {
  const { maxRetries, delay } = retryOptions;
  const logger = options.logger || createMockLogger();
  
  let lastError: Error | null = null;
  
  // Try to create the application with retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createTestingApp(rootModule, options);
    } catch (error) {
      lastError = error;
      logger.warn(
        `Failed to create test application (attempt ${attempt}/${maxRetries}): ${error.message}`
      );
      
      // Don't wait on the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError || new Error('Failed to create test application after multiple attempts');
}

/**
 * Creates a test application with GraphQL support.
 * 
 * This is a convenience function that creates a test application with GraphQL enabled
 * and configured for testing GraphQL queries and mutations.
 * 
 * @param rootModule The root module to use for the test application
 * @param options Additional options for the test application
 * @returns A TestAppResult containing the application, module, and cleanup function
 * 
 * @example
 * const { app, cleanup } = await createGraphQLTestingApp();
 * 
 * // Execute a GraphQL query
 * const query = `
 *   query {
 *     users {
 *       id
 *       name
 *     }
 *   }
 * `;
 * 
 * const response = await request(app.getHttpServer())
 *   .post('/graphql')
 *   .send({ query })
 *   .expect(200);
 * 
 * // After tests
 * await cleanup();
 */
export async function createGraphQLTestingApp(
  rootModule: Type<any> = AppModule,
  options: TestAppOptions = {}
): Promise<TestAppResult> {
  return createTestingApp(rootModule, {
    enableGraphQL: true,
    ...options,
  });
}

/**
 * Creates a test application with a mock authenticated user.
 * 
 * This is a convenience function that creates a test application with a mock user
 * already authenticated, which is useful for testing protected endpoints without
 * having to generate and provide JWT tokens.
 * 
 * @param user The mock user to authenticate (defaults to a standard test user)
 * @param rootModule The root module to use for the test application
 * @param options Additional options for the test application
 * @returns A TestAppResult containing the application, module, and cleanup function
 * 
 * @example
 * // Create a test app with a custom authenticated user
 * const { app, cleanup } = await createAuthenticatedTestingApp({
 *   id: 'custom-user-id',
 *   email: 'custom@example.com',
 *   roles: ['admin'],
 * });
 * 
 * // Access a protected endpoint without providing a token
 * const response = await request(app.getHttpServer())
 *   .get('/protected-endpoint')
 *   .expect(200);
 * 
 * // After tests
 * await cleanup();
 */
export async function createAuthenticatedTestingApp(
  user: Partial<IUserResponse> = {},
  rootModule: Type<any> = AppModule,
  options: TestAppOptions = {}
): Promise<TestAppResult> {
  const mockUser = createMockUser(user);
  
  return createTestingApp(rootModule, {
    mockUser,
    ...options,
  });
}
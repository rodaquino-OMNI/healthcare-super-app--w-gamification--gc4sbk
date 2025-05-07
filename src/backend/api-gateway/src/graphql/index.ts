/**
 * GraphQL Module Entry Point
 *
 * This file serves as the main entry point for the GraphQL module, exporting the resolver map,
 * schema, and custom scalars. It is imported by the NestJS GraphQLModule configuration to set up
 * Apollo Server with the appropriate resolvers, type definitions, and custom scalar implementations.
 *
 * The module follows a standardized structure to ensure consistency across the monorepo:
 * - Resolvers are organized by domain/journey and aggregated in resolvers.ts
 * - Custom scalars are implemented in the scalars directory and exported through scalars/index.ts
 * - The schema is defined in schema.graphql and loaded using the fs module
 *
 * Error handling strategies are implemented at multiple levels:
 * - Custom scalars include validation and error handling for input/output
 * - Resolvers implement retry policies and circuit breakers for service calls
 * - Global error handling is configured through Apollo Server plugins
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import { GraphQLError } from 'graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

// Import interfaces from the shared package for type safety
import { 
  GraphQLModuleOptions, 
  ErrorHandlingConfig,
  RetryPolicy
} from '@austa/interfaces/api';

// Import resolvers and custom scalars
import { resolvers } from './resolvers';

// Import custom scalar implementations
import { 
  DateScalar,
  DateTimeScalar,
  JSONScalar,
  URLScalar
} from './scalars';

// Read the schema file
const typeDefs = readFileSync(
  join(process.cwd(), 'src/backend/api-gateway/src/graphql/schema.graphql'),
  'utf8'
);

/**
 * Default retry policy for GraphQL operations
 * This policy is used for operations that don't specify their own retry configuration
 */
const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 1000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE'
  ]
};

/**
 * Error handling configuration for the GraphQL server
 * This configuration determines how different types of errors are processed and returned to clients
 */
const errorHandlingConfig: ErrorHandlingConfig = {
  includeStacktraceInResponse: process.env.NODE_ENV !== 'production',
  maskSensitiveErrors: true,
  defaultErrorMessage: 'An unexpected error occurred',
  errorCodes: {
    BAD_USER_INPUT: { statusCode: 400, includeDetails: true },
    UNAUTHENTICATED: { statusCode: 401, includeDetails: true },
    FORBIDDEN: { statusCode: 403, includeDetails: false },
    NOT_FOUND: { statusCode: 404, includeDetails: true },
    CONFLICT: { statusCode: 409, includeDetails: true },
    INTERNAL_SERVER_ERROR: { statusCode: 500, includeDetails: false }
  },
  formatError: (error: GraphQLError) => {
    // Custom error formatting logic
    const formattedError = {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      path: error.path,
      // Include stack trace only in development
      ...(process.env.NODE_ENV !== 'production' && { stacktrace: error.extensions?.stacktrace })
    };

    // Log the error for internal monitoring
    console.error('[GraphQL Error]', {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
      originalError: error.originalError
    });

    return formattedError;
  }
};

/**
 * GraphQL module configuration options
 * These options are used to configure the NestJS GraphQLModule
 */
export const graphqlOptions: GraphQLModuleOptions = {
  typeDefs,
  resolvers,
  playground: false,
  introspection: process.env.NODE_ENV !== 'production',
  context: ({ req, res }) => ({ req, res }),
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
  formatError: errorHandlingConfig.formatError,
  csrfPrevention: true,
  cache: 'bounded',
  retryPolicy: defaultRetryPolicy
};

// Export custom scalars for registration with the schema
export const customScalars = {
  Date: DateScalar,
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  URL: URLScalar
};

// Export everything needed for the GraphQL module
export { 
  typeDefs,
  resolvers,
  errorHandlingConfig,
  defaultRetryPolicy
};
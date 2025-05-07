/**
 * GraphQL Custom Scalars Index
 *
 * This file aggregates and exports all custom GraphQL scalar implementations for the API Gateway.
 * It serves as the central entry point that allows Apollo Server to register these scalars
 * with the GraphQL schema.
 *
 * The scalars defined here are used across all journey services to ensure consistent
 * data validation, serialization, and deserialization for specialized data types like:
 * - Dates and timestamps (Date, DateTime)
 * - Complex data structures (JSON)
 * - URL validation and normalization (URL)
 *
 * Each scalar implementation provides:
 * - Type-safe definitions via @austa/interfaces
 * - Comprehensive validation with detailed error messages
 * - Journey-specific context in error handling
 * - Consistent serialization/deserialization behavior
 *
 * Usage in Apollo Server configuration:
 * ```typescript
 * import { ApolloServer } from 'apollo-server-express';
 * import { typeDefs } from './schema';
 * import { resolvers } from './resolvers';
 * import { scalars } from './graphql/scalars';
 *
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers: [resolvers, scalars],
 * });
 * ```
 */

// Import scalar implementations using standardized module resolution
import { GraphQLScalarType } from 'graphql';
import { ScalarDefinitions } from '@austa/interfaces/api';

// Import individual scalar implementations
import DateScalar from './date';
import DateTimeScalar from './dateTime';
import JSONScalar from './json';
import URLScalar from './url';

/**
 * Error handler for scalar validation failures
 * Provides detailed error messages with journey-specific context
 *
 * @param error The original error
 * @param scalarName The name of the scalar that failed validation
 * @param value The value that failed validation
 * @returns Enhanced error with journey context
 */
export const handleScalarError = (
  error: Error,
  scalarName: string,
  value: unknown
): Error => {
  // Add journey-specific context to error messages
  const journeyContext = getJourneyContextForScalar(scalarName);
  
  // Create enhanced error message
  const enhancedMessage = `${scalarName} scalar validation error: ${error.message}. ` +
    `This may affect ${journeyContext}. Value: ${JSON.stringify(value)}`;
  
  // Return new error with enhanced message
  return new Error(enhancedMessage);
};

/**
 * Helper function to provide journey-specific context for scalar errors
 *
 * @param scalarName The name of the scalar
 * @returns A string describing the journey context
 */
const getJourneyContextForScalar = (scalarName: string): string => {
  switch (scalarName) {
    case 'Date':
      return 'date fields in health records, appointments, or plan coverage dates';
    case 'DateTime':
      return 'timestamp fields for appointments, health metrics, or event timing';
    case 'JSON':
      return 'complex data structures in health metrics, device connections, or plan details';
    case 'URL':
      return 'external links, resource locations, or API endpoints';
    default:
      return 'data validation across multiple journeys';
  }
};

/**
 * Map of scalar names to their implementations
 * Used for programmatic access to scalar types
 */
export const scalarMap: Record<string, GraphQLScalarType> = {
  Date: DateScalar,
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  URL: URLScalar,
};

/**
 * Scalar resolvers object for Apollo Server
 * This format allows direct inclusion in the resolvers array
 */
export const scalars: ScalarDefinitions = {
  Date: DateScalar,
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  URL: URLScalar,
};

/**
 * Default export of all scalar implementations
 * Provides a convenient way to import all scalars at once
 */
export default scalars;
/**
 * GraphQL Custom Scalars
 *
 * This file aggregates and exports all custom GraphQL scalar implementations for the API Gateway.
 * It serves as the central entry point that allows Apollo Server to register these scalars with
 * the GraphQL schema.
 *
 * Each scalar implementation provides:
 * - Serialization: Converting from internal representation to JSON-compatible values
 * - Parsing: Converting from JSON-compatible values to internal representation
 * - Validation: Ensuring values meet the scalar's constraints
 *
 * The scalars use type definitions from @austa/interfaces to ensure type safety and consistency
 * across the monorepo.
 */

// Import scalar type definitions from shared interfaces package
import { 
  DateScalarType,
  DateTimeScalarType,
  JSONScalarType,
  URLScalarType
} from '@austa/interfaces/api';

// Import individual scalar implementations
import { DateScalar } from './date';
import { DateTimeScalar } from './dateTime';
import { JSONScalar } from './json';
import { URLScalar } from './url';

// Re-export all scalar implementations
export {
  DateScalar,
  DateTimeScalar,
  JSONScalar,
  URLScalar
};

/**
 * Register all custom scalars with the GraphQL schema
 * This function is called by the GraphQL module to register all custom scalars
 * @param schema The GraphQL schema to register scalars with
 */
export const registerScalars = (schema: any): void => {
  // Register each scalar with the schema
  schema.registerScalar('Date', DateScalar);
  schema.registerScalar('DateTime', DateTimeScalar);
  schema.registerScalar('JSON', JSONScalar);
  schema.registerScalar('URL', URLScalar);

  console.log('Custom GraphQL scalars registered successfully');
};

/**
 * Get all custom scalar definitions
 * This function returns an object mapping scalar names to their implementations
 * @returns An object with scalar names as keys and implementations as values
 */
export const getScalarDefinitions = () => ({
  Date: DateScalar,
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  URL: URLScalar
});
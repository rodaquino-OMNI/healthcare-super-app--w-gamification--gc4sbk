/**
 * JSON Custom Scalar Type for GraphQL
 *
 * This file implements the JSON custom scalar type for the GraphQL schema,
 * enabling storage and validation of arbitrary JSON data structures.
 *
 * The JSON scalar is essential for flexible data structures in:
 * - Health metrics (dynamic measurement data)
 * - User preferences (configurable settings)
 * - Device connection details (varying by device type)
 * - Plan coverage details (insurance-specific data)
 * - Claim additional information (context-dependent fields)
 *
 * This implementation provides:
 * - Robust JSON validation with safe parsing and stringification
 * - Detailed error messages for malformed JSON
 * - Type safety through integration with @austa/interfaces
 */

import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import { JSONScalarType } from '@austa/interfaces/api';

/**
 * Safely parses a JSON string into a JavaScript object
 * @param value The JSON string to parse
 * @returns The parsed JavaScript object
 * @throws GraphQLError if the value cannot be parsed as valid JSON
 */
const parseJSON = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch (error) {
    if (error instanceof Error) {
      throw new GraphQLError(
        `Invalid JSON value: ${error.message}`,
        {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidValue: value,
            errorMessage: error.message
          }
        }
      );
    }
    throw new GraphQLError('Invalid JSON value', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidValue: value
      }
    });
  }
};

/**
 * Safely stringifies a JavaScript object into a JSON string
 * @param value The JavaScript object to stringify
 * @returns The stringified JSON
 * @throws GraphQLError if the value cannot be stringified to valid JSON
 */
const stringifyJSON = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    if (error instanceof Error) {
      throw new GraphQLError(
        `Unable to stringify JSON value: ${error.message}`,
        {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidValue: String(value),
            errorMessage: error.message
          }
        }
      );
    }
    throw new GraphQLError('Unable to stringify JSON value', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidValue: String(value)
      }
    });
  }
};

/**
 * Validates that a value is a valid JSON object or array
 * @param value The value to validate
 * @returns The validated value
 * @throws GraphQLError if the value is not a valid JSON object or array
 */
const validateJSON = (value: unknown): unknown => {
  // Null is a valid JSON value
  if (value === null) {
    return null;
  }

  // Check if the value is a valid JSON object or array
  if (
    typeof value !== 'object' &&
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    throw new GraphQLError('JSON scalar must be an object, array, string, number, boolean, or null', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidValue: String(value),
        expectedType: 'JSON-compatible value'
      }
    });
  }

  return value;
};

/**
 * GraphQL scalar type for JSON values
 * Implements the JSONScalarType interface from @austa/interfaces
 */
export const JSONScalar: JSONScalarType = new GraphQLScalarType({
  name: 'JSON',
  description: 'The `JSON` scalar type represents JSON values as specified by ECMA-404',
  
  // Convert outgoing JSON values to string
  serialize(value: unknown): string {
    const validatedValue = validateJSON(value);
    return typeof validatedValue === 'string'
      ? validatedValue
      : stringifyJSON(validatedValue);
  },
  
  // Convert incoming JSON values from AST
  parseValue(value: unknown): unknown {
    // For variables, the parsed JSON value is already available
    return typeof value === 'string' ? parseJSON(value) : validateJSON(value);
  },
  
  // Convert incoming JSON values from literal
  parseLiteral(ast): unknown {
    // Handle string literals (most common case)
    if (ast.kind === Kind.STRING) {
      return parseJSON(ast.value);
    }
    
    // Handle other literal types that are valid JSON values
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return Number(ast.value);
    }
    
    if (ast.kind === Kind.BOOLEAN) {
      return ast.value;
    }
    
    if (ast.kind === Kind.NULL) {
      return null;
    }
    
    // Object and list literals are not supported directly
    // They should be passed as JSON strings or variables
    throw new GraphQLError(
      `JSON scalar literal must be a string containing valid JSON, or a Number, Boolean, or null value`,
      {
        nodes: [ast],
        extensions: {
          code: 'BAD_USER_INPUT',
          invalidKind: ast.kind,
          expectedKind: 'STRING, INT, FLOAT, BOOLEAN, or NULL'
        }
      }
    );
  }
});
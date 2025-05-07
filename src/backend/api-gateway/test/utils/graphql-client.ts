import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiErrorTypes } from '@austa/interfaces/api/error.types';
import { ApiRequestTypes } from '@austa/interfaces/api/request.types';
import { ApiResponseTypes } from '@austa/interfaces/api/response.types';

/**
 * GraphQL Client for API Gateway Testing
 * 
 * A specialized utility for simplifying GraphQL testing in NestJS applications.
 * This client wraps supertest to provide a more intuitive API for making GraphQL
 * queries and mutations in tests, with built-in support for variables, directives,
 * and response validation.
 * 
 * Features:
 * - Type-safe GraphQL operations with TypeScript generics
 * - Simplified query and mutation execution
 * - Built-in error handling and response validation
 * - Support for GraphQL variables and directives
 * - Integration with @austa/interfaces for standardized types
 * - API versioning support
 * 
 * @example
 * ```typescript
 * // Create a client instance
 * const client = new GraphQLClient(app);
 * 
 * // Execute a query with variables
 * const { data, errors } = await client.query<{ user: UserDto }>(
 *   `query GetUser($id: ID!) { user(id: $id) { id name email } }`,
 *   { id: '123' }
 * );
 * 
 * // Execute a mutation
 * const result = await client.mutation<{ createUser: UserDto }>(
 *   `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id name } }`,
 *   { input: { name: 'Test User', email: 'test@example.com' } }
 * );
 * ```
 */
export class GraphQLClient {
  private readonly endpoint = '/graphql';
  private readonly agent: request.SuperTest<request.Test>;
  
  /**
   * Creates a new GraphQL client instance for testing.
   * 
   * @param app - The NestJS application instance
   * @param options - Optional configuration options
   */
  constructor(
    private readonly app: INestApplication,
    private readonly options: GraphQLClientOptions = {}
  ) {
    this.agent = request(app.getHttpServer());
  }

  /**
   * Executes a GraphQL query operation.
   * 
   * @template TData - The expected data type returned by the query
   * @param query - The GraphQL query string
   * @param variables - Optional variables for the query
   * @param requestOptions - Additional request options
   * @returns A promise resolving to the GraphQL response
   * 
   * @example
   * ```typescript
   * const { data, errors } = await client.query<{ user: UserDto }>(
   *   `query GetUser($id: ID!) { user(id: $id) { id name email } }`,
   *   { id: '123' }
   * );
   * ```
   */
  async query<TData = any>(
    query: string,
    variables?: Record<string, any>,
    requestOptions?: RequestOptions
  ): Promise<GraphQLResponse<TData>> {
    return this.execute<TData>({ query, variables }, requestOptions);
  }

  /**
   * Executes a GraphQL mutation operation.
   * 
   * @template TData - The expected data type returned by the mutation
   * @param mutation - The GraphQL mutation string
   * @param variables - Optional variables for the mutation
   * @param requestOptions - Additional request options
   * @returns A promise resolving to the GraphQL response
   * 
   * @example
   * ```typescript
   * const { data, errors } = await client.mutation<{ createUser: UserDto }>(
   *   `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id name } }`,
   *   { input: { name: 'Test User', email: 'test@example.com' } }
   * );
   * ```
   */
  async mutation<TData = any>(
    mutation: string,
    variables?: Record<string, any>,
    requestOptions?: RequestOptions
  ): Promise<GraphQLResponse<TData>> {
    return this.execute<TData>({ query: mutation, variables }, requestOptions);
  }

  /**
   * Executes a GraphQL operation with the specified operation name.
   * 
   * @template TData - The expected data type returned by the operation
   * @param document - The GraphQL document containing multiple operations
   * @param operationName - The name of the operation to execute
   * @param variables - Optional variables for the operation
   * @param requestOptions - Additional request options
   * @returns A promise resolving to the GraphQL response
   * 
   * @example
   * ```typescript
   * const { data, errors } = await client.operation<{ user: UserDto }>(
   *   `
   *     query GetUser($id: ID!) { user(id: $id) { id name } }
   *     query GetUsers { users { id name } }
   *   `,
   *   'GetUser',
   *   { id: '123' }
   * );
   * ```
   */
  async operation<TData = any>(
    document: string,
    operationName: string,
    variables?: Record<string, any>,
    requestOptions?: RequestOptions
  ): Promise<GraphQLResponse<TData>> {
    return this.execute<TData>({ 
      query: document, 
      operationName, 
      variables 
    }, requestOptions);
  }

  /**
   * Executes a raw GraphQL request with full control over the request body.
   * 
   * @template TData - The expected data type returned by the operation
   * @param requestBody - The complete GraphQL request body
   * @param requestOptions - Additional request options
   * @returns A promise resolving to the GraphQL response
   * 
   * @example
   * ```typescript
   * const { data, errors } = await client.execute<{ user: UserDto }>(
   *   {
   *     query: `query GetUser($id: ID!) { user(id: $id) { id name } }`,
   *     variables: { id: '123' },
   *     operationName: 'GetUser'
   *   }
   * );
   * ```
   */
  async execute<TData = any>(
    requestBody: GraphQLRequestBody,
    requestOptions: RequestOptions = {}
  ): Promise<GraphQLResponse<TData>> {
    // Prepare headers with authentication if provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestOptions.headers || {}
    };

    // Add API version header if specified
    if (requestOptions.apiVersion) {
      headers['X-API-Version'] = requestOptions.apiVersion;
    }

    // Add authorization header if token is provided
    if (requestOptions.authToken) {
      headers['Authorization'] = `Bearer ${requestOptions.authToken}`;
    }

    // Execute the request
    const response = await this.agent
      .post(this.endpoint)
      .set(headers)
      .send(requestBody);

    // Parse and validate the response
    return this.parseAndValidateResponse<TData>(response);
  }

  /**
   * Parses and validates a GraphQL response.
   * 
   * @template TData - The expected data type
   * @param response - The supertest response object
   * @returns The parsed and validated GraphQL response
   * @private
   */
  private parseAndValidateResponse<TData>(
    response: request.Response
  ): GraphQLResponse<TData> {
    const { body, status } = response;

    // Check for HTTP errors (non-200 responses)
    if (status !== 200) {
      const errorResponse: ApiErrorTypes.ApiErrorResponse = body;
      throw new GraphQLClientError(
        `HTTP Error: ${status} ${errorResponse.message || 'Unknown error'}`,
        {
          status,
          body: errorResponse,
          type: 'http_error'
        }
      );
    }

    // For GraphQL responses, even errors come with a 200 status code
    // but include an 'errors' array in the response body
    const graphqlResponse: GraphQLResponse<TData> = {
      data: body.data as TData,
      errors: body.errors as ApiErrorTypes.GraphQLErrorResponse[],
      extensions: body.extensions,
      status,
      headers: response.headers
    };

    // If the client is configured to throw on GraphQL errors, do so
    if (this.options.throwOnGraphQLErrors && graphqlResponse.errors?.length) {
      throw new GraphQLClientError(
        `GraphQL Error: ${graphqlResponse.errors[0].message}`,
        {
          graphqlErrors: graphqlResponse.errors,
          type: 'graphql_error'
        }
      );
    }

    return graphqlResponse;
  }

  /**
   * Creates a GraphQL fragment string.
   * 
   * @param name - The fragment name
   * @param typeName - The type the fragment is applied to
   * @param fields - The fields to include in the fragment
   * @returns The formatted GraphQL fragment string
   * 
   * @example
   * ```typescript
   * const userFragment = GraphQLClient.createFragment(
   *   'UserFields',
   *   'User',
   *   'id name email createdAt'
   * );
   * // Returns: "fragment UserFields on User { id name email createdAt }"
   * ```
   */
  static createFragment(
    name: string,
    typeName: string,
    fields: string
  ): string {
    return `fragment ${name} on ${typeName} { ${fields} }`;
  }

  /**
   * Formats a GraphQL query with optional fragments.
   * 
   * @param queryName - The name of the query
   * @param queryFields - The fields to query
   * @param fragments - Optional fragments to include
   * @param variables - Optional variable definitions
   * @returns The formatted GraphQL query string
   * 
   * @example
   * ```typescript
   * const userFragment = GraphQLClient.createFragment(
   *   'UserFields',
   *   'User',
   *   'id name email createdAt'
   * );
   * 
   * const query = GraphQLClient.formatQuery(
   *   'GetUser',
   *   'user(id: $id) { ...UserFields }',
   *   [userFragment],
   *   '($id: ID!)'
   * );
   * ```
   */
  static formatQuery(
    queryName: string,
    queryFields: string,
    fragments: string[] = [],
    variables: string = ''
  ): string {
    const query = `query ${queryName}${variables} { ${queryFields} }`;
    return fragments.length ? `${query}\n${fragments.join('\n')}` : query;
  }

  /**
   * Formats a GraphQL mutation with optional fragments.
   * 
   * @param mutationName - The name of the mutation
   * @param mutationFields - The fields to include in the mutation
   * @param fragments - Optional fragments to include
   * @param variables - Optional variable definitions
   * @returns The formatted GraphQL mutation string
   * 
   * @example
   * ```typescript
   * const userFragment = GraphQLClient.createFragment(
   *   'UserFields',
   *   'User',
   *   'id name email'
   * );
   * 
   * const mutation = GraphQLClient.formatMutation(
   *   'CreateUser',
   *   'createUser(input: $input) { ...UserFields }',
   *   [userFragment],
   *   '($input: CreateUserInput!)'
   * );
   * ```
   */
  static formatMutation(
    mutationName: string,
    mutationFields: string,
    fragments: string[] = [],
    variables: string = ''
  ): string {
    const mutation = `mutation ${mutationName}${variables} { ${mutationFields} }`;
    return fragments.length ? `${mutation}\n${fragments.join('\n')}` : mutation;
  }
}

/**
 * Error class for GraphQL client errors.
 */
export class GraphQLClientError extends Error {
  /**
   * Creates a new GraphQL client error.
   * 
   * @param message - The error message
   * @param details - Additional error details
   */
  constructor(
    message: string,
    public readonly details?: {
      status?: number;
      body?: any;
      graphqlErrors?: ApiErrorTypes.GraphQLErrorResponse[];
      type?: 'http_error' | 'graphql_error' | 'validation_error';
    }
  ) {
    super(message);
    this.name = 'GraphQLClientError';
  }
}

/**
 * Options for configuring the GraphQL client.
 */
export interface GraphQLClientOptions {
  /**
   * Whether to throw an error when GraphQL errors are present in the response.
   * @default false
   */
  throwOnGraphQLErrors?: boolean;
}

/**
 * Additional options for GraphQL requests.
 */
export interface RequestOptions {
  /**
   * Custom headers to include with the request.
   */
  headers?: Record<string, string>;
  
  /**
   * Authentication token to include in the Authorization header.
   */
  authToken?: string;
  
  /**
   * API version to include in the X-API-Version header.
   */
  apiVersion?: string;
}

/**
 * Structure of a GraphQL request body.
 */
export interface GraphQLRequestBody {
  /**
   * The GraphQL query/mutation/subscription document.
   */
  query: string;
  
  /**
   * Optional variables for the operation.
   */
  variables?: Record<string, any>;
  
  /**
   * Optional name of the operation to execute (required when the document contains multiple operations).
   */
  operationName?: string;
}

/**
 * Structure of a GraphQL response.
 * 
 * @template TData - The type of data returned in the response
 */
export interface GraphQLResponse<TData = any> {
  /**
   * The data returned by the GraphQL operation, or null if there was an error.
   */
  data?: TData | null;
  
  /**
   * Array of errors that occurred during execution, or undefined if no errors occurred.
   */
  errors?: ApiErrorTypes.GraphQLErrorResponse[];
  
  /**
   * Optional extensions returned by the GraphQL server.
   */
  extensions?: Record<string, any>;
  
  /**
   * The HTTP status code of the response.
   */
  status: number;
  
  /**
   * The HTTP headers of the response.
   */
  headers: Record<string, string | string[]>;
}
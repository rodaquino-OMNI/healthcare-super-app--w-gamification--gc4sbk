import { ApolloClient, InMemoryCache } from '@apollo/client'; // v3.8.10
import { createUploadLink } from 'apollo-upload-client'; // v17.0.0
import axios, { AxiosInstance } from 'axios'; // v1.4.0
import { apiConfig } from 'src/web/shared/config/apiConfig';
import { 
  GraphQLClientOptions, 
  ApolloUploadLinkOptions 
} from '@austa/interfaces/api/graphql.types';
import { 
  RESTClientOptions, 
  RESTRequestInterceptor, 
  RESTResponseInterceptor 
} from '@austa/interfaces/api/rest.types';
import { 
  APIErrorHandler, 
  APIErrorResponse 
} from '@austa/interfaces/api/error.types';

/**
 * Apollo Client instance for GraphQL API requests
 * 
 * This client is configured to handle both standard GraphQL queries/mutations
 * and file uploads (via apollo-upload-client). It uses an in-memory cache to
 * store query results for better performance.
 *
 * The client uses 'cache-and-network' fetch policy by default, which means it will
 * immediately show cached data while fetching fresh data from the server in the background.
 * 
 * @version Apollo Client 3.8.10
 */
export const graphQLClient = new ApolloClient({
  // Upload link supports multipart form requests for file uploads
  link: createUploadLink({
    uri: `${apiConfig.baseURL}/graphql`,
    credentials: 'include', // Include cookies for authentication if needed
  } as ApolloUploadLinkOptions),
  // In-memory cache stores query results for faster subsequent access
  cache: new InMemoryCache({
    typePolicies: {
      // Type policies can be defined here to customize cache behavior
      // for specific types in the GraphQL schema
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Balance between fresh data and good UX
      errorPolicy: 'all', // Handle errors in the UI rather than throwing
    },
    query: {
      fetchPolicy: 'network-only', // Default to always fetching fresh data
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
} as GraphQLClientOptions);

/**
 * Axios instance for REST API requests
 * 
 * This client is configured for standard REST API calls to endpoints that are
 * not covered by the GraphQL API. It's particularly useful for file uploads,
 * downloads, and integration with legacy or third-party APIs.
 * 
 * @version Axios 1.4.0
 */
export const restClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json', // Default to JSON requests
  },
  timeout: 30000, // 30 second timeout for healthcare operations
} as RESTClientOptions);

// Add request interceptor to attach authentication tokens when available
restClient.interceptors.request.use(
  (config) => {
    // You can add token logic here, for example:
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: APIErrorResponse) => {
    return Promise.reject(error);
  }
) as RESTRequestInterceptor;

// Add response interceptor to handle common error scenarios
restClient.interceptors.response.use(
  (response) => response,
  (error: APIErrorResponse) => {
    // Handle common errors (401, 403, 500, etc.)
    // Could implement global error handling, logging, or retry logic here
    return Promise.reject(error);
  }
) as RESTResponseInterceptor;
/**
 * @file errors.example.ts
 * @description Examples of how to use the error handling framework
 * This file is for documentation purposes only and is not used in production.
 */

import { graphQLClient, restClient } from './client';
import {
  ApiError,
  CircuitBreaker,
  createProtectedApiClient,
  withErrorHandling,
  withRetry,
  logError,
  isErrorType,
  NetworkError,
  AuthenticationError
} from './errors';

// Example 1: Create protected API clients
// ----------------------------------------

// Create protected GraphQL client with circuit breaker and retry
const protectedGraphQLClient = createProtectedApiClient(graphQLClient, new CircuitBreaker(), {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 5000
});

// Create protected REST client
const protectedRestClient = createProtectedApiClient(restClient);

// Example 2: Using the protected clients
// --------------------------------------

async function fetchUserProfile(userId: string) {
  try {
    // The client automatically handles retries and circuit breaking
    const response = await protectedRestClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    // All errors are already converted to ApiError instances
    if (error instanceof ApiError) {
      // Handle specific error types
      if (isErrorType(error, AuthenticationError)) {
        // Handle authentication errors
        console.log('User needs to log in again');
        // Navigate to login screen
      } else if (isErrorType(error, NetworkError)) {
        // Handle network errors
        console.log('Network is unavailable');
        // Show offline mode
      } else {
        // Handle other API errors
        console.log(error.getUserMessage());
      }
    }
    
    // Log the error with additional context
    logError(error, { userId, action: 'fetchUserProfile' });
    
    // Rethrow or return a default value
    throw error;
  }
}

// Example 3: Using withRetry directly
// ----------------------------------

async function fetchWithRetry(url: string) {
  return withRetry(
    async () => {
      const response = await restClient.get(url);
      return response.data;
    },
    {
      maxRetries: 3,
      initialDelayMs: 300,
      onRetry: (error, retryCount) => {
        console.log(`Retrying ${url} (attempt ${retryCount}) after error: ${error.message}`);
      }
    }
  );
}

// Example 4: Using withErrorHandling to wrap a function
// ---------------------------------------------------

const fetchData = async (endpoint: string, params: Record<string, any>) => {
  const response = await restClient.get(endpoint, { params });
  return response.data;
};

// Create a protected version of the function
const protectedFetchData = withErrorHandling(fetchData);

// Example 5: Using a dedicated CircuitBreaker instance
// --------------------------------------------------

// Create a circuit breaker for a specific service
const paymentServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  onStateChange: (from, to) => {
    console.log(`Payment service circuit changed from ${from} to ${to}`);
  }
});

async function processPayment(paymentData: any) {
  return paymentServiceCircuitBreaker.execute(async () => {
    const response = await restClient.post('/payments', paymentData);
    return response.data;
  });
}

// Example 6: Handling errors in React components
// --------------------------------------------

/*
import React, { useState, useEffect } from 'react';
import { Text, View, Button } from 'react-native';

function UserProfileScreen({ userId }: { userId: string }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserProfile(userId);
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        // Should never happen with our error handling framework
        setError(new ApiError({
          message: 'Unknown error occurred',
          context: { originalError: err }
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [userId]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return (
      <View>
        <Text>{error.getUserMessage()}</Text>
        <Button title="Retry" onPress={loadProfile} />
      </View>
    );
  }

  if (!profile) {
    return <Text>No profile data available</Text>;
  }

  return (
    <View>
      <Text>Name: {profile.name}</Text>
      <Text>Email: {profile.email}</Text>
    </View>
  );
}
*/

// Example 7: Using the error handling with GraphQL queries
// ------------------------------------------------------

/*
import { gql, useQuery } from '@apollo/client';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

function UserProfileWithGraphQL({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_USER, {
    variables: { id: userId },
    // Use the protected client we created earlier
    client: protectedGraphQLClient,
  });

  if (loading) return <Text>Loading...</Text>;

  if (error) {
    // Parse the error to get a user-friendly message
    const apiError = error instanceof ApiError ? error : parseError(error);
    
    return (
      <View>
        <Text>{apiError.getUserMessage()}</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View>
      <Text>Name: {data.user.name}</Text>
      <Text>Email: {data.user.email}</Text>
    </View>
  );
}
*/
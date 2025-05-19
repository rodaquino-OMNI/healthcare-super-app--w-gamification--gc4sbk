/**
 * Plan API Module
 * 
 * This module provides functions for interacting with the Plan service,
 * including methods for fetching insurance plans, submitting claims,
 * and managing benefits and coverage information.
 * 
 * This is part of the Plan & Benefits Journey which provides insurance management
 * through plan viewing, claim submission, and benefit tracking features.
 */

import { gql, ApolloClient } from '@apollo/client'; // v3.7.0
import { apiConfig } from 'src/web/shared/config/apiConfig';
import { API_TIMEOUT } from 'src/web/shared/constants/index';
import { 
  GET_PLAN,
  GET_CLAIMS
} from 'src/web/shared/graphql/queries/plan.queries';
import { 
  SUBMIT_CLAIM,
  UPLOAD_CLAIM_DOCUMENT,
  UPDATE_CLAIM,
  CANCEL_CLAIM
} from 'src/web/shared/graphql/mutations/plan.mutations';

// Import standardized interfaces from the shared interfaces package
import { 
  Plan, 
  Claim, 
  ClaimStatus,
  ClaimDocument
} from '@austa/interfaces/api/plan.api';
import { ApiError } from '@austa/interfaces/api/error.types';

// Apollo client instance for making GraphQL requests to the Plan service
const client = new ApolloClient({
  uri: apiConfig.journeys.plan.url,
  cache: new (ApolloClient as any).InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
      timeout: API_TIMEOUT
    },
    mutate: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
      timeout: API_TIMEOUT
    }
  }
});

/**
 * Fetches a specific insurance plan by ID.
 * 
 * @param planId - The ID of the plan to fetch
 * @returns A promise that resolves to a Plan object
 * @throws ApiError if the request fails
 */
export async function getPlan(planId: string): Promise<Plan> {
  try {
    const { data, errors } = await client.query({
      query: GET_PLAN,
      variables: { planId }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'PLAN_FETCH_ERROR',
        { planId, graphQLErrors: errors }
      );
      console.error('Error fetching plan:', error);
      throw error;
    }
    
    return data.getPlan;
  } catch (error) {
    console.error('Error fetching plan:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to fetch plan details',
      'PLAN_FETCH_ERROR',
      { planId, originalError: error }
    );
  }
}

/**
 * Fetches claims for a specific plan, optionally filtered by status.
 * 
 * @param planId - The ID of the plan whose claims to fetch
 * @param status - Optional claim status to filter by
 * @returns A promise that resolves to an array of Claim objects
 * @throws ApiError if the request fails
 */
export async function getClaims(planId: string, status?: ClaimStatus): Promise<Claim[]> {
  try {
    const { data, errors } = await client.query({
      query: GET_CLAIMS,
      variables: { planId, status }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'CLAIMS_FETCH_ERROR',
        { planId, status, graphQLErrors: errors }
      );
      console.error('Error fetching claims:', error);
      throw error;
    }
    
    return data.getClaims;
  } catch (error) {
    console.error('Error fetching claims:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to fetch claims',
      'CLAIMS_FETCH_ERROR',
      { planId, status, originalError: error }
    );
  }
}

/**
 * Submits a new insurance claim for a specific plan.
 * 
 * @param planId - The ID of the plan to submit the claim for
 * @param type - The type of claim (e.g., 'MEDICAL', 'DENTAL')
 * @param procedureCode - The procedure code for the claim
 * @param providerName - The name of the healthcare provider
 * @param serviceDate - The date of service (ISO format)
 * @param amount - The amount being claimed
 * @param documents - Optional array of document IDs to attach to the claim
 * @returns A promise that resolves to the newly created Claim object
 * @throws ApiError if the request fails
 */
export async function submitClaim(
  planId: string,
  type: string,
  procedureCode: string,
  providerName: string,
  serviceDate: string,
  amount: number,
  documents?: string[]
): Promise<Claim> {
  try {
    const { data, errors } = await client.mutate({
      mutation: SUBMIT_CLAIM,
      variables: {
        planId,
        type,
        procedureCode,
        providerName,
        serviceDate,
        amount,
        documents
      }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'CLAIM_SUBMISSION_ERROR',
        { planId, type, graphQLErrors: errors }
      );
      console.error('Error submitting claim:', error);
      throw error;
    }
    
    return data.submitClaim;
  } catch (error) {
    console.error('Error submitting claim:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to submit claim',
      'CLAIM_SUBMISSION_ERROR',
      { planId, type, originalError: error }
    );
  }
}

/**
 * Uploads a document to an existing claim.
 * 
 * @param claimId - The ID of the claim to upload the document to
 * @param file - The file to upload
 * @returns A promise that resolves to the document metadata
 * @throws ApiError if the request fails
 */
export async function uploadClaimDocument(
  claimId: string,
  file: File
): Promise<ClaimDocument> {
  try {
    const { data, errors } = await client.mutate({
      mutation: UPLOAD_CLAIM_DOCUMENT,
      variables: { claimId, file }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'DOCUMENT_UPLOAD_ERROR',
        { claimId, graphQLErrors: errors }
      );
      console.error('Error uploading document:', error);
      throw error;
    }
    
    return data.uploadClaimDocument;
  } catch (error) {
    console.error('Error uploading document:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to upload document',
      'DOCUMENT_UPLOAD_ERROR',
      { claimId, originalError: error }
    );
  }
}

/**
 * Updates an existing claim with additional information.
 * 
 * @param id - The ID of the claim to update
 * @param additionalInfo - Additional information to add to the claim
 * @returns A promise that resolves to the updated Claim object
 * @throws ApiError if the request fails
 */
export async function updateClaim(
  id: string,
  additionalInfo: Record<string, any>
): Promise<Claim> {
  try {
    const { data, errors } = await client.mutate({
      mutation: UPDATE_CLAIM,
      variables: { id, additionalInfo }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'CLAIM_UPDATE_ERROR',
        { id, graphQLErrors: errors }
      );
      console.error('Error updating claim:', error);
      throw error;
    }
    
    return data.updateClaim;
  } catch (error) {
    console.error('Error updating claim:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to update claim',
      'CLAIM_UPDATE_ERROR',
      { id, originalError: error }
    );
  }
}

/**
 * Cancels an existing claim.
 * 
 * @param id - The ID of the claim to cancel
 * @returns A promise that resolves to the cancelled Claim object
 * @throws ApiError if the request fails
 */
export async function cancelClaim(id: string): Promise<Claim> {
  try {
    const { data, errors } = await client.mutate({
      mutation: CANCEL_CLAIM,
      variables: { id }
    });
    
    // Handle GraphQL errors if present
    if (errors && errors.length > 0) {
      const error = new ApiError(
        errors[0].message,
        'CLAIM_CANCELLATION_ERROR',
        { id, graphQLErrors: errors }
      );
      console.error('Error cancelling claim:', error);
      throw error;
    }
    
    return data.cancelClaim;
  } catch (error) {
    console.error('Error cancelling claim:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to cancel claim',
      'CLAIM_CANCELLATION_ERROR',
      { id, originalError: error }
    );
  }
}
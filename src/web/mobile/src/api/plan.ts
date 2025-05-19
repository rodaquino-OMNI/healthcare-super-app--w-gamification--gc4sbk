/**
 * @file plan.ts
 * @description API functions for the Plan journey, enabling interaction with backend services
 * for insurance-related features such as retrieving plan details, submitting and managing claims,
 * and verifying coverage.
 */

import { ReactNativeFile } from 'apollo-upload-client'; // v17.0.0
import { graphQLClient, restClient } from './client';
import {
  GET_PLAN,
  GET_CLAIMS,
} from '@austa/shared/graphql/queries/plan.queries';
import {
  SUBMIT_CLAIM,
  UPLOAD_CLAIM_DOCUMENT,
  UPDATE_CLAIM,
  CANCEL_CLAIM,
} from '@austa/shared/graphql/mutations/plan.mutations';

// Import types from @austa/interfaces instead of local definitions
import {
  Plan,
  Claim,
  ClaimStatus,
  ClaimType
} from '@austa/interfaces/plan';

// Import error handling utilities
import {
  withErrorHandling,
  ValidationError,
  logError,
  RetryOptions,
  CircuitBreaker
} from './errors';

// File validation constants
const MAX_FILE_SIZE_MB = 10; // 10MB max file size
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Retry options for plan-related API calls
const PLAN_API_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 1.5
};

// Circuit breaker for plan service
const planServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 15000
});

/**
 * Validates a file before upload to ensure it meets security requirements
 * 
 * @param file - The file object to validate
 * @throws ValidationError if the file doesn't meet requirements
 */
const validateFile = (file: { uri: string; name: string; type: string; size?: number }): void => {
  const validationErrors: Record<string, string[]> = {};
  
  // Check file type
  if (!file.type || !ALLOWED_FILE_TYPES.includes(file.type)) {
    validationErrors.fileType = [
      `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_FILE_TYPES.join(', ')}`
    ];
  }
  
  // Check file name for security
  if (!file.name || file.name.includes('..') || file.name.includes('/')) {
    validationErrors.fileName = ['Nome de arquivo inválido'];
  }
  
  // Check file size if available
  if (file.size) {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      validationErrors.fileSize = [
        `Tamanho máximo de arquivo excedido. Limite: ${MAX_FILE_SIZE_MB}MB`
      ];
    }
  }
  
  // Throw validation error if any issues found
  if (Object.keys(validationErrors).length > 0) {
    throw new ValidationError({
      message: 'Validação de arquivo falhou',
      validationErrors
    });
  }
};

/**
 * Fetches all insurance plans for a specific user
 * 
 * @param userId - The ID of the user whose plans to fetch
 * @returns A promise that resolves to an array of Plan objects
 */
export const getPlans = withErrorHandling(
  async (userId: string): Promise<Plan[]> => {
    const { data } = await graphQLClient.query({
      query: GET_PLAN,
      variables: { userId },
      fetchPolicy: 'network-only', // Ensure we get the latest data
    });
    
    return data.getPlans;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Fetches a specific insurance plan by ID
 * 
 * @param planId - The ID of the plan to fetch
 * @returns A promise that resolves to a Plan object
 */
export const getPlan = withErrorHandling(
  async (planId: string): Promise<Plan> => {
    const { data } = await graphQLClient.query({
      query: GET_PLAN,
      variables: { planId },
      fetchPolicy: 'cache-first',
    });
    
    return data.getPlan;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Fetches claims for a specific plan, optionally filtered by status
 * 
 * @param planId - The ID of the plan whose claims to fetch
 * @param status - Optional claim status to filter by
 * @returns A promise that resolves to an array of Claim objects
 */
export const getClaims = withErrorHandling(
  async (planId: string, status?: ClaimStatus): Promise<Claim[]> => {
    const { data } = await graphQLClient.query({
      query: GET_CLAIMS,
      variables: { planId, status },
      fetchPolicy: 'network-only', // Ensure we get the latest data
    });
    
    return data.getClaims;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Fetches a specific claim by ID
 * 
 * @param claimId - The ID of the claim to fetch
 * @returns A promise that resolves to a Claim object
 */
export const getClaim = withErrorHandling(
  async (claimId: string): Promise<Claim> => {
    // Note: Using GET_CLAIMS and extracting the specific claim
    // In a production implementation, this would likely use a dedicated GET_CLAIM query
    const { data } = await graphQLClient.query({
      query: GET_CLAIMS,
      variables: { claimId },
      fetchPolicy: 'cache-first',
    });
    
    return data.getClaim;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Submits a new insurance claim
 * 
 * @param planId - The ID of the plan for which to submit a claim
 * @param claimData - The claim data including type, procedure code, provider name, etc.
 * @returns A promise that resolves to the submitted Claim object
 */
export const submitClaim = withErrorHandling(
  async (planId: string, claimData: {
    type: ClaimType;
    procedureCode: string;
    providerName: string;
    serviceDate: string;
    amount: number;
    documents?: string[];
  }): Promise<Claim> => {
    const { data } = await graphQLClient.mutate({
      mutation: SUBMIT_CLAIM,
      variables: {
        planId,
        ...claimData,
      },
      // Update cache to include the new claim
      update: (cache, { data }) => {
        try {
          // Read existing claims from cache
          const existingData = cache.readQuery({
            query: GET_CLAIMS,
            variables: { planId }
          });
          
          // If we have existing data, update the cache with the new claim
          if (existingData) {
            cache.writeQuery({
              query: GET_CLAIMS,
              variables: { planId },
              data: {
                getClaims: [...existingData.getClaims, data.submitClaim]
              }
            });
          }
        } catch (error) {
          // Log cache update errors but don't fail the operation
          logError(error, { operation: 'submitClaim', planId });
        }
      }
    });
    
    return data.submitClaim;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Uploads a document to an existing claim with secure validation
 * 
 * @param claimId - The ID of the claim to which the document will be uploaded
 * @param file - The file object to upload
 * @returns A promise that resolves to the uploaded document information
 */
export const uploadClaimDocument = withErrorHandling(
  async (
    claimId: string,
    file: { uri: string; name: string; type: string; size?: number }
  ): Promise<{ id: string; fileName: string; fileType: string; fileSize: number; uploadedAt: string }> => {
    // Validate file before upload
    validateFile(file);
    
    // Create a ReactNativeFile instance for GraphQL upload
    const uploadFile = new ReactNativeFile({
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    const { data } = await graphQLClient.mutate({
      mutation: UPLOAD_CLAIM_DOCUMENT,
      variables: {
        claimId,
        file: uploadFile,
      },
    });
    
    return data.uploadClaimDocument;
  },
  planServiceCircuitBreaker,
  {
    ...PLAN_API_RETRY_OPTIONS,
    // Don't retry file uploads automatically to prevent duplicate uploads
    maxRetries: 0
  }
);

/**
 * Updates an existing claim with additional information
 * 
 * @param claimId - The ID of the claim to update
 * @param additionalInfo - Additional information to add to the claim
 * @returns A promise that resolves to the updated Claim object
 */
export const updateClaim = withErrorHandling(
  async (
    claimId: string,
    additionalInfo: Record<string, any>
  ): Promise<Claim> => {
    const { data } = await graphQLClient.mutate({
      mutation: UPDATE_CLAIM,
      variables: {
        id: claimId,
        additionalInfo,
      },
      // Update cache with the updated claim
      update: (cache, { data }) => {
        try {
          // Update the specific claim in the cache
          cache.modify({
            id: cache.identify({ __typename: 'Claim', id: claimId }),
            fields: {
              // Update all fields from the response
              ...Object.keys(data.updateClaim).reduce((acc, key) => {
                acc[key] = () => data.updateClaim[key];
                return acc;
              }, {})
            }
          });
        } catch (error) {
          // Log cache update errors but don't fail the operation
          logError(error, { operation: 'updateClaim', claimId });
        }
      }
    });
    
    return data.updateClaim;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Cancels an existing claim
 * 
 * @param claimId - The ID of the claim to cancel
 * @returns A promise that resolves to the canceled Claim object
 */
export const cancelClaim = withErrorHandling(
  async (claimId: string): Promise<Claim> => {
    const { data } = await graphQLClient.mutate({
      mutation: CANCEL_CLAIM,
      variables: {
        id: claimId,
      },
      // Update cache with the canceled claim
      update: (cache, { data }) => {
        try {
          // Update the specific claim in the cache
          cache.modify({
            id: cache.identify({ __typename: 'Claim', id: claimId }),
            fields: {
              status: () => 'canceled'
            }
          });
        } catch (error) {
          // Log cache update errors but don't fail the operation
          logError(error, { operation: 'cancelClaim', claimId });
        }
      }
    });
    
    return data.cancelClaim;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Simulates the cost of a procedure based on coverage
 * 
 * @param planId - The ID of the plan to use for the simulation
 * @param procedureData - The procedure details for the simulation
 * @returns A promise that resolves to the cost simulation results
 */
export const simulateCost = withErrorHandling(
  async (
    planId: string,
    procedureData: {
      procedureCode: string;
      providerName?: string;
      providerId?: string;
      estimatedCost?: number;
    }
  ): Promise<{ totalCost: number; coveredAmount: number; outOfPocket: number }> => {
    const { data } = await restClient.post(`/plans/${planId}/simulate-cost`, procedureData);
    
    return data;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Retrieves the digital insurance card for a specific plan
 * 
 * @param planId - The ID of the plan for which to get the digital card
 * @returns A promise that resolves to the digital card information
 */
export const getDigitalCard = withErrorHandling(
  async (
    planId: string
  ): Promise<{ cardImageUrl: string; cardData: object }> => {
    const { data } = await restClient.get(`/plans/${planId}/digital-card`);
    
    return data;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);

/**
 * Fetches all benefits available under the user's current plan
 * 
 * @returns A promise that resolves to an array of Benefit objects
 */
export const getBenefits = withErrorHandling(
  async (): Promise<Benefit[]> => {
    // Get the current user's active plan first
    const { data: userPlans } = await graphQLClient.query({
      query: GET_PLAN,
      variables: { active: true },
      fetchPolicy: 'cache-first',
    });
    
    // If no active plan is found, return empty array
    if (!userPlans?.getPlans?.length) {
      return [];
    }
    
    // Use the first active plan to fetch benefits
    const activePlanId = userPlans.getPlans[0].id;
    
    // Fetch benefits for the active plan
    const { data } = await restClient.get(`/plans/${activePlanId}/benefits`);
    
    return data.benefits;
  },
  planServiceCircuitBreaker,
  PLAN_API_RETRY_OPTIONS
);
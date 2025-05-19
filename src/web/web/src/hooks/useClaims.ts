import { useMutation } from '@apollo/client';
import { Claim, ClaimSubmissionData } from '@austa/interfaces/plan';
import { SUBMIT_CLAIM } from 'src/web/shared/graphql/mutations/plan.mutations';
import { useAuth } from '@austa/journey-context';
import { useJourney } from '@austa/journey-context';
import { ApiError } from '@austa/interfaces/common';

/**
 * Custom hook for managing and interacting with claims data within the 'My Plan' journey
 * Encapsulates the logic for submitting insurance claims with appropriate authentication
 * and journey context awareness
 */
export const useClaims = () => {
  // Get current user session for authentication
  const { session } = useAuth();
  
  // Get current journey context for analytics and tracking
  const { currentJourney } = useJourney();
  
  // Set up the mutation for submitting claims
  const [submitClaimMutation, { loading: submitting, error: submitError }] = useMutation(SUBMIT_CLAIM);
  
  /**
   * Submits a new insurance claim to the backend
   * 
   * @param claimData - The data for the insurance claim being submitted
   * @returns A promise that resolves to the submitted claim data
   * @throws ApiError with structured error information if submission fails
   */
  const submitClaim = async (claimData: ClaimSubmissionData): Promise<Claim> => {
    try {
      // Ensure we're in the Plan journey context
      if (currentJourney?.id !== 'plan') {
        throw new ApiError({
          code: 'INVALID_JOURNEY_CONTEXT',
          message: 'Claims can only be submitted from the Plan journey',
          status: 400
        });
      }
      
      // Execute the mutation with the provided claim data
      const { data } = await submitClaimMutation({
        variables: claimData,
        context: {
          headers: {
            // Include authentication token in the request header
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      });
      
      // Return the submitted claim from the response
      return data.submitClaim;
    } catch (error) {
      // Transform error into a structured ApiError if it's not already
      const apiError = error instanceof ApiError 
        ? error 
        : new ApiError({
            code: 'CLAIM_SUBMISSION_FAILED',
            message: error.message || 'Failed to submit claim',
            status: 500,
            originalError: error
          });
      
      // Log the structured error
      console.error('Error submitting claim:', apiError);
      
      // Re-throw the structured error for handling by the caller
      throw apiError;
    }
  };
  
  // Return claim operations and status
  return {
    submitClaim,
    submitting,
    submitError
  };
};
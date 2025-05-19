import React from 'react';
import { useQuery } from '@apollo/client';
import { Box, Stack, Text } from '@design-system/primitives';
import { Card, Button } from '@austa/design-system';
import { ClaimCard } from '@austa/design-system/plan';
import { Claim } from '@austa/interfaces/plan';
import { GET_CLAIMS } from 'src/web/shared/graphql/queries/plan.queries';
import { useJourneyContext } from '@austa/journey-context';
import { useAuth } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';
import { useRouter } from 'next/router';

/**
 * A dashboard widget that displays recent insurance claims for the Plan journey.
 * Fetches claim data via GraphQL and renders each claim inside a ClaimCard component.
 * Provides navigation to the full claims listing and claim submission pages.
 *
 * @returns The rendered ClaimsWidget component.
 */
export const ClaimsWidget: React.FC = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { currentJourney } = useJourneyContext();

  // Fetch claims data for the current user's active plan
  const { loading, error, data } = useQuery(GET_CLAIMS, {
    variables: {
      planId: session?.user?.activePlanId,
      // No status filter - get all claims
    },
    skip: !session?.user?.activePlanId,
    fetchPolicy: 'cache-and-network',
  });

  // Get the most recent claims (up to 3)
  const recentClaims = React.useMemo(() => {
    if (!data?.getClaims) return [];
    
    return [...data.getClaims]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [data?.getClaims]);

  // Handle navigation to claim details
  const handleViewClaimDetails = (claimId: string) => {
    router.push(`/plan/claims/${claimId}`);
  };

  // Handle navigation to all claims
  const handleViewAllClaims = () => {
    router.push('/plan/claims');
  };

  // Handle navigation to submit new claim
  const handleSubmitClaim = () => {
    router.push('/plan/claims/submit');
  };

  return (
    <Card journey={JOURNEY_IDS.PLAN} elevation="sm">
      <Box padding="medium">
        <Text fontSize="md" fontWeight="medium" marginBottom="medium">
          Recent Claims
        </Text>

        {loading && (
          <Box padding="medium" textAlign="center">
            <Text color="neutral.gray600">Loading claims...</Text>
          </Box>
        )}

        {error && (
          <Box padding="medium" textAlign="center">
            <Text color="semantic.error">Failed to load claims. Please try again later.</Text>
          </Box>
        )}

        {!loading && !error && recentClaims.length === 0 && (
          <Box padding="medium" textAlign="center">
            <Text color="neutral.gray600">You have no recent claims.</Text>
          </Box>
        )}

        {!loading && !error && recentClaims.length > 0 && (
          <Stack direction="vertical" spacing="medium">
            {recentClaims.map((claim: Claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onViewDetails={() => handleViewClaimDetails(claim.id)}
                compact={true}
              />
            ))}
          </Stack>
        )}

        <Stack direction="horizontal" spacing="small" justifyContent="center" marginTop="large">
          <Button
            journey={JOURNEY_IDS.PLAN}
            variant="secondary"
            size="md"
            onPress={handleViewAllClaims}
            accessibilityLabel="View all claims"
          >
            View All Claims
          </Button>
          <Button
            journey={JOURNEY_IDS.PLAN}
            variant="primary"
            size="md"
            onPress={handleSubmitClaim}
            accessibilityLabel="Submit a new claim"
          >
            Submit Claim
          </Button>
        </Stack>
      </Box>
    </Card>
  );
};
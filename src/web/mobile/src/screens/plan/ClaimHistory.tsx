import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import interfaces from @austa/interfaces package
import { Claim } from '@austa/interfaces/plan';

// Import journey context from @austa/journey-context package
import { useJourney, useClaims } from '@austa/journey-context';

// Import components from @austa/design-system
import { Button, LoadingIndicator, ErrorState } from '@austa/design-system';
import { ClaimCard } from '@austa/design-system/plan/ClaimCard';
import { Box, Stack } from '@design-system/primitives';

// Import constants
import { MOBILE_PLAN_ROUTES } from 'src/web/shared/constants/routes';

/**
 * Renders the claim history screen, fetching and displaying a list of claims.
 * @returns A React element displaying the claim history.
 */
const ClaimHistory: React.FC = () => {
  // Retrieves the current journey context using `useJourney()`
  const { journey } = useJourney();

  // Retrieves the navigation object using `useNavigation()`
  const navigation = useNavigation();

  // Fetch claims data using the useClaims hook from journey-context
  const { claims, isLoading, error } = useClaims();

  // Handle viewing claim details
  const handleViewDetails = (claimId: string) => {
    // Navigate to claim details within the claims screen
    // Since there's no specific CLAIM_DETAIL route, we'll just log for now
    console.log(`View details for claim: ${claimId}`);
  };

  // Handle tracking a claim
  const handleTrackClaim = (claimId: string) => {
    // Navigate to claim tracking within the claims screen
    // Since there's no specific CLAIM_TRACKING route, we'll just log for now
    console.log(`Track claim: ${claimId}`);
  };

  // Displays a loading indicator while the data is being fetched
  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <LoadingIndicator journey={journey} label="Loading claims..." />
      </Box>
    );
  }

  // Displays an error message if there is an error fetching the data
  if (error) {
    return (
      <ErrorState 
        title="Failed to load claims" 
        description={error.message} 
        journey={journey} 
        onRetry={() => useClaims().refetch()}
      />
    );
  }

  // Renders the list of claims or an empty state if no claims are available
  return (
    <View style={styles.container}>
      {claims && claims.length > 0 ? (
        <Stack space="md">
          {claims.map((claim: Claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onViewDetails={() => handleViewDetails(claim.id)}
              onTrackClaim={() => handleTrackClaim(claim.id)}
              showActions={true}
              compact={false}
              accessibilityLabel={`Claim for ${claim.type}, amount ${claim.amount}, status ${claim.status}`}
            />
          ))}
        </Stack>
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ErrorState
            title="No claims found"
            description="You haven't submitted any claims yet."
            journey={journey}
            icon="document-text"
          />
        </Box>
      )}

      {/* Provides a button to navigate to the Claim Submission screen */}
      <Box padding="md">
        <Button
          variant="primary"
          journey="plan"
          onPress={() => navigation.navigate(MOBILE_PLAN_ROUTES.CLAIM_SUBMISSION)}
          accessibilityLabel="Submit a new claim"
          fullWidth={true}
          size="lg"
        >
          Submit New Claim
        </Button>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default ClaimHistory;
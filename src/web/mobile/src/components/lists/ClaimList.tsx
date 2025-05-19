import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Claim } from '@austa/interfaces/plan';
import { useClaims, useJourneyContext } from '@austa/journey-context';
import { EmptyState, LoadingIndicator } from '@austa/design-system';
import { Card } from '@austa/design-system';
import { Box, Stack, Text } from '@design-system/primitives';

/**
 * Renders a list of claims or an empty state message if no claims are available.
 * Component for the Plan journey that displays insurance claims in a scrollable list.
 * @returns A list of ClaimCard components or an EmptyState component.
 */
export const ClaimList: React.FC = () => {
  // Get journey context for theming
  const { currentJourney } = useJourneyContext();
  
  // Fetches claims data using the `useClaims` hook from journey-context
  const { claims, isLoading, error } = useClaims();

  // Access the navigation object
  const navigation = useNavigation();

  // Handle navigation to claim submission screen
  const handleNavigateToSubmission = () => {
    try {
      navigation.navigate('ClaimSubmission');
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  // If loading, display a loading indicator from design system
  if (isLoading) {
    return (
      <Box padding="medium" alignItems="center" justifyContent="center" accessibilityLabel="Loading claims">
        <LoadingIndicator size="medium" color={`${currentJourney}.primary`} />
        <Box marginTop="small">
          <Text variant="body" color={`${currentJourney}.primary`}>Loading claims...</Text>
        </Box>
      </Box>
    );
  }

  // If there is an error, display an error message.
  if (error) {
    return (
      <Box padding="medium" alignItems="center" justifyContent="center" accessibilityLabel={`Error: ${error.message}`}>
        <Text variant="body" color="error.base">Error: {error.message}</Text>
      </Box>
    );
  }

  // If there are no claims, display an EmptyState component.
  if (!claims || claims.length === 0) {
    return (
      <EmptyState
        icon="document"
        title="No claims found"
        description="Submit a new claim to get started."
        actionLabel="Submit Claim"
        onAction={handleNavigateToSubmission}
        journey="plan"
        accessibilityLabel="No claims found. Submit a new claim to get started."
      />
    );
  }

  // If there are claims, render a list of ClaimCard components.
  return (
    <Box padding="medium" accessibilityLabel={`${claims.length} claims found`}>
      <Stack space="medium">
        {claims.map((claim: Claim) => (
          <Box key={claim.id}>
            <Card 
              variant="outlined" 
              journey="plan"
              accessibilityLabel={`Claim ${claim.id}, Type: ${claim.type}, Amount: ${claim.amount}, Status: ${claim.status}`}
            >
              <Stack space="small" padding="medium">
                <Text variant="subtitle" color="plan.primary">Claim ID: {claim.id}</Text>
                <Text variant="body">Type: {claim.type}</Text>
                <Text variant="body">Amount: {claim.amount}</Text>
                <Text variant="body">Status: {claim.status}</Text>
                <Text variant="body">Submitted At: {claim.submittedAt}</Text>
              </Stack>
            </Card>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
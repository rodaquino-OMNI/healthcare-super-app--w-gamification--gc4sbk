import React from 'react';
import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Benefit } from '@austa/interfaces/plan';
import { BenefitCard } from '@austa/design-system/plan/BenefitCard';
import { LoadingIndicator, ErrorState, EmptyState } from '@austa/design-system/components';
import { JourneyHeader } from '@austa/design-system/components';
import { useJourney } from '@austa/journey-context';
import { getBenefits } from '../../api/plan';

/**
 * BenefitsScreen component displays a list of benefits available to the user
 * under their insurance plan. It handles loading, error, and empty states.
 */
const BenefitsScreen: React.FC = () => {
  const { currentJourney } = useJourney();

  // Use React Query for data fetching with proper caching and error handling
  const { 
    data: benefits, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<Benefit[], Error>({
    queryKey: ['benefits'],
    queryFn: getBenefits,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <JourneyHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingIndicator journey="plan" label="Loading benefits..." />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1 }}>
        <JourneyHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ErrorState
            icon="error"
            title="Unable to load benefits"
            description={error?.message || 'There was a problem loading your benefits. Please try again later.'}
            actionLabel="Try Again"
            onAction={refetch}
            journey="plan"
          />
        </View>
      </View>
    );
  }

  if (!benefits || benefits.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <JourneyHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EmptyState
            icon="card"
            title="No benefits available"
            description="You don't have any benefits available under your current plan."
            journey="plan"
          />
        </View>
      </View>
    );
  }

  // Render the benefits list using BenefitCard from design system
  return (
    <View style={{ flex: 1 }}>
      <JourneyHeader />
      <FlatList
        data={benefits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <BenefitCard 
            benefit={item} 
            accessibilityLabel={`Benefit: ${item.type}`}
          />
        )}
      />
    </View>
  );
};

export default BenefitsScreen;
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Stack, Text } from '@design-system/primitives';
import { CoverageInfoCard } from '@austa/design-system/plan';
import { LoadingIndicator, ErrorState, EmptyState } from '@austa/design-system/components';
import { Coverage as CoverageType } from '@austa/interfaces/plan';
import { useJourney } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';
import { getPlans } from '../../api/plan';
import { useAuth } from '@austa/journey-context';

/**
 * Coverage component displays insurance coverage information for a user's plan
 * within the 'My Plan & Benefits' journey.
 * 
 * Addresses requirement F-103-RQ-001: Display detailed insurance coverage information.
 */
const Coverage: React.FC = () => {
  // Get the journey context
  const { setJourney } = useJourney();
  
  // Set the current journey to Plan when component mounts
  useEffect(() => {
    setJourney(JOURNEY_IDS.PLAN);
  }, [setJourney]);
  
  // Get planId from the URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('planId') || '';
  
  // Get the current auth context
  const { session, getUserFromToken } = useAuth();
  
  // Extract user ID from the token if a session exists
  const decodedToken = session ? getUserFromToken(session.accessToken) : null;
  
  // Assuming the token contains either an 'id' or 'sub' claim for the user ID
  const userId = decodedToken?.id || decodedToken?.sub;
  
  // Use React Query to fetch and cache the plan data
  const { 
    data: plan,
    isLoading, 
    error
  } = useQuery({
    queryKey: ['plans', userId, planId],
    queryFn: async () => {
      // Ensure we have a user ID before making the request
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Fetch all plans for the user
      const plans = await getPlans(userId);
      return plans.find(p => p.id === planId);
    },
    enabled: !!userId && !!planId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3 // Retry failed requests up to 3 times
  });
  
  // Extract coverage information from the plan, or empty array if plan is undefined
  const coverage = plan?.coverages || [];
  
  // Handle loading state
  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" padding="md">
        <LoadingIndicator size="large" />
        <Text 
          marginTop="md" 
          textAlign="center"
          color="neutral.gray700"
          fontSize="md"
        >
          Carregando informações de cobertura...
        </Text>
      </Box>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar as informações de cobertura."
        message="Por favor, tente novamente mais tarde."
        journey="plan"
      />
    );
  }
  
  // Handle empty data state
  if (!coverage || coverage.length === 0) {
    return (
      <EmptyState
        message="Nenhuma informação de cobertura disponível para este plano."
        journey="plan"
      />
    );
  }
  
  // Render coverage information
  return (
    <Box 
      padding="md" 
      backgroundColor="journeys.plan.background"
      flex={1}
    >
      <Text 
        as="h1"
        fontSize="xl"
        fontWeight="bold"
        color="journeys.plan.primary"
        marginBottom="xs"
        fontFamily="heading"
      >
        Informações de Cobertura
      </Text>
      
      <Text 
        fontSize="md"
        color="neutral.gray800"
        marginBottom="lg"
        fontFamily="base"
        lineHeight="base"
      >
        Detalhes da sua cobertura atual incluindo limitações e valores de copagamento.
      </Text>
      
      <Stack direction="column" spacing="md" marginBottom="lg">
        {coverage.map((item: CoverageType) => (
          <CoverageInfoCard key={item.id} coverage={item} />
        ))}
      </Stack>
    </Box>
  );
};

export default Coverage;
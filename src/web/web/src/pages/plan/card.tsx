import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import PlanLayout from '../../layouts/PlanLayout';
import { InsuranceCard } from '@austa/design-system/plan/InsuranceCard';
import { useAuth } from '@austa/journey-context/hooks/useAuth';
import { useJourney } from '@austa/journey-context';
import { getDigitalCard } from '../../api/plan';
import { Plan, User } from '@austa/interfaces/plan';

/**
 * A Next.js page component that displays the digital insurance card for the user's health plan
 */
const DigitalCardPage: NextPage = () => {
  // Get the user's authentication state using the standardized useAuth hook
  const { session, isAuthenticated, isLoading: authIsLoading } = useAuth();
  
  // Use the journey context for plan-specific state management
  const { activateJourney } = useJourney('plan');

  // Activate the plan journey when component mounts
  React.useEffect(() => {
    activateJourney();
  }, [activateJourney]);

  // Use the useQuery hook to fetch the digital card data for the user's plan
  const { isLoading, error, data: digitalCardData } = useQuery({
    queryKey: ['digitalCard', session?.userId],
    queryFn: () => getDigitalCard(session?.accessToken),
    enabled: isAuthenticated && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle loading and error states
  if (authIsLoading || isLoading) {
    return (
      <PlanLayout>
        <div>Loading digital card...</div>
      </PlanLayout>
    );
  }

  if (error) {
    return (
      <PlanLayout>
        <div>Error loading digital card: {(error as Error).message}</div>
      </PlanLayout>
    );
  }

  // Render the InsuranceCard component with the fetched plan and user data
  return (
    <PlanLayout>
      <Head>
        <title>Meu Cartão Digital - AUSTA</title>
        <meta name="description" content="Visualize e compartilhe seu cartão digital do plano de saúde AUSTA." />
      </Head>
      {digitalCardData && session && (
        <InsuranceCard
          plan={digitalCardData.plan as Plan}
          user={{
            id: session.userId,
            name: session.userName,
            cpf: session.userDocument,
          } as User}
          onShare={() => shareCard()}
        />
      )}
    </PlanLayout>
  );
};

/**
 * Function to share the digital insurance card
 */
const shareCard = () => {
  // Check if the Web Share API is available in the browser
  if (navigator.share) {
    // If available, use the navigator.share API to share the card
    navigator.share({
      title: 'Meu Cartão Digital AUSTA',
      text: 'Confira meu cartão digital do plano de saúde AUSTA!',
      url: window.location.href,
    })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.log('Error sharing', error));
  } else {
    // If not available, provide a fallback mechanism (e.g., copy to clipboard)
    alert('Web Share API is not supported in this browser. Please copy the URL to share.');
  }
};

export default DigitalCardPage;
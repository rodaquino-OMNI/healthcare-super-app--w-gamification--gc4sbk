import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Updated imports from @austa/design-system
import { ClaimCard } from '@austa/design-system/plan/ClaimCard';
import { CoverageInfoCard } from '@austa/design-system/plan/CoverageInfoCard';
import { InsuranceCard } from '@austa/design-system/plan/InsuranceCard';
// Local components still used
import { EmptyState } from '@web/mobile/src/components/shared/EmptyState';
import { LoadingIndicator } from '@web/mobile/src/components/shared/LoadingIndicator';
import { JourneyHeader } from '@web/mobile/src/components/shared/JourneyHeader';
// Updated hooks from @austa/journey-context
import { useAuth, usePlanJourney } from '@austa/journey-context';
// Import interfaces from @austa/interfaces
import { Claim, Coverage, Plan, User } from '@austa/interfaces/plan';

/**
 * Renders the main dashboard screen for the Plan journey, fetching and displaying key information related to the user's insurance plan and benefits.
 */
const PlanDashboard: React.FC = () => {
  // Access navigation object
  const navigation = useNavigation();

  // Access authentication context from journey-context
  const { session, getUserFromToken } = useAuth();

  // Extract user ID from the token
  const decodedToken = session ? getUserFromToken(session.accessToken) : null;
  const userId = decodedToken?.id || decodedToken?.sub;

  // Use the plan journey context for claims and coverage data
  const { 
    plan,
    claims, 
    coverage,
    isLoadingClaims,
    isLoadingCoverage,
    isLoadingPlan,
    claimsError,
    coverageError,
    planError,
    fetchClaims,
    fetchCoverage
  } = usePlanJourney();

  // Effect to fetch claims and coverage when component mounts
  useEffect(() => {
    if (userId && plan?.id) {
      fetchClaims(plan.id);
      fetchCoverage(plan.id);
    }
  }, [userId, plan?.id, fetchClaims, fetchCoverage]);

  // Handle navigation to claim details screen
  const handleClaimPress = (claimId: string) => {
    navigation.navigate('ClaimDetails', { claimId });
  };

  // Handle navigation to coverage details screen
  const handleCoveragePress = (coverageId: string) => {
    navigation.navigate('CoverageDetails', { coverageId });
  };

  // Handle sharing the insurance card
  const handleShareCard = () => {
    // Implement sharing logic here
    console.log('Share card pressed');
  };

  // Handle submitting a new claim
  const handleNewClaim = () => {
    navigation.navigate('ClaimSubmission');
  };

  // Handle tracking a claim
  const handleTrackClaim = (claimId: string) => {
    navigation.navigate('ClaimTracking', { claimId });
  };

  // Handle viewing claim details
  const handleViewClaimDetails = (claimId: string) => {
    navigation.navigate('ClaimDetails', { claimId });
  };

  // Effect to log errors if they occur using standardized error handling
  useEffect(() => {
    if (coverageError) {
      // Using standardized error handling instead of console.error
      console.error('Error fetching coverage:', coverageError.message);
    }
    if (claimsError) {
      console.error('Error fetching claims:', claimsError.message);
    }
    if (planError) {
      console.error('Error fetching plan:', planError.message);
    }
  }, [coverageError, claimsError, planError]);

  // Show loading state if plan is loading
  if (isLoadingPlan) {
    return (
      <View style={styles.container}>
        <JourneyHeader title="Meu Plano & Benefícios" />
        <LoadingIndicator label="Carregando informações do plano..." />
      </View>
    );
  }

  // Show error state if plan failed to load
  if (planError) {
    return (
      <View style={styles.container}>
        <JourneyHeader title="Meu Plano & Benefícios" />
        <EmptyState
          icon="error"
          title="Erro ao carregar plano"
          description="Tente novamente mais tarde."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <JourneyHeader title="Meu Plano & Benefícios" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Insurance Card */}
        {plan && (
          <InsuranceCard
            plan={plan}
            user={plan.user as User}
            onShare={handleShareCard}
          />
        )}

        {/* Coverage Information */}
        {isLoadingCoverage ? (
          <LoadingIndicator label="Carregando Cobertura..." />
        ) : coverageError ? (
          <EmptyState
            icon="error"
            title="Erro ao carregar cobertura"
            description="Tente novamente mais tarde."
          />
        ) : coverage && coverage.length > 0 ? (
          coverage.map((item: Coverage) => (
            <CoverageInfoCard
              key={item.id}
              coverage={item}
              onPress={() => handleCoveragePress(item.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="document"
            title="Nenhuma cobertura encontrada"
            description="Verifique os detalhes do seu plano."
          />
        )}

        {/* Claims */}
        {isLoadingClaims ? (
          <LoadingIndicator label="Carregando Solicitações..." />
        ) : claimsError ? (
          <EmptyState
            icon="error"
            title="Erro ao carregar solicitações"
            description="Tente novamente mais tarde."
          />
        ) : claims && claims.length > 0 ? (
          claims.map((claim: Claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onPress={() => handleClaimPress(claim.id)}
              onViewDetails={() => handleViewClaimDetails(claim.id)}
              onTrackClaim={() => handleTrackClaim(claim.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="document"
            title="Nenhuma solicitação encontrada"
            description="Submeta suas solicitações por aqui."
            actionLabel="Nova Solicitação"
            onAction={handleNewClaim}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // Light blue background
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
});

export default PlanDashboard;
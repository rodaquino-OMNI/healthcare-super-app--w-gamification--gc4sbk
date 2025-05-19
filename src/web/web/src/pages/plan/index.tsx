import React from 'react';
import { useRouter } from 'next/router';
import { Text, Button } from '@design-system/primitives';
import PlanLayout from 'src/web/web/src/layouts/PlanLayout';
import { ClaimsWidget } from 'src/web/web/src/components/dashboard/ClaimsWidget';
import { WEB_PLAN_ROUTES } from 'src/web/shared/constants/routes';
import { useJourneyContext } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';

/**
 * The main dashboard component for the 'My Plan & Benefits' journey.
 * @returns {JSX.Element} The rendered dashboard with widgets and navigation.
 */
const PlanDashboard: React.FC = () => {
  const router = useRouter();
  const { setCurrentJourney } = useJourneyContext();
  
  // Set the current journey to PLAN when this component mounts
  React.useEffect(() => {
    setCurrentJourney(JOURNEY_IDS.PLAN);
  }, [setCurrentJourney]);

  // Handle navigation to coverage details
  const handleViewCoverage = () => {
    router.push(WEB_PLAN_ROUTES.COVERAGE);
  };

  return (
    <PlanLayout>
      {/* Displays a heading for the Plan Dashboard */}
      <Text fontSize="2xl" fontWeight="medium">
        Meu Plano & Benefícios
      </Text>

      {/* Includes the ClaimsWidget to show recent claims */}
      <ClaimsWidget />

      {/* Includes a button to navigate to the coverage details page */}
      <Button
        journey={JOURNEY_IDS.PLAN}
        variant="primary"
        onPress={handleViewCoverage}
        accessibilityLabel="View coverage details"
      >
        Ver detalhes da cobertura
      </Button>
    </PlanLayout>
  );
};

export default PlanDashboard;
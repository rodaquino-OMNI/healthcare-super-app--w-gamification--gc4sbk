import React from 'react';
import { Sidebar } from 'src/web/web/src/components/navigation/Sidebar';
import { JourneyHeader } from '@austa/design-system/components';
import { useJourney } from '@austa/journey-context';
import { JOURNEY_IDS } from 'src/web/shared/constants/journeys';
import MainLayout from 'src/web/web/src/layouts/MainLayout';
import { LayoutProps } from '@austa/interfaces/components';

/**
 * Provides the layout for the 'My Plan & Benefits' journey.
 * Wraps content in the MainLayout and adds journey-specific header and sidebar.
 * 
 * @param children - React nodes to render within the layout.
 * @returns The rendered layout with the sidebar and header.
 */
const PlanLayout: React.FC<LayoutProps> = ({ children }) => {
  // Retrieves the journey context using the centralized journey context provider
  const { journey, setJourney } = useJourney();

  // Ensure the journey is set to PLAN when this layout is used
  React.useEffect(() => {
    if (journey?.id !== JOURNEY_IDS.PLAN) {
      setJourney(JOURNEY_IDS.PLAN);
    }
  }, [journey, setJourney]);

  return (
    <MainLayout>
      {/* Renders the JourneyHeader component with the Plan journey title */}
      <JourneyHeader 
        title="Meu Plano & Benefícios" 
        journey={JOURNEY_IDS.PLAN}
        testId="plan-journey-header"
      />

      {/* Renders the Sidebar component for navigation */}
      <Sidebar />

      {/* Renders the children (content of the page) */}
      {children}
    </MainLayout>
  );
};

export default PlanLayout;
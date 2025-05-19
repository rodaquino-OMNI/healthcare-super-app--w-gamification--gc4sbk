import React from 'react';
import { useJourney } from '@austa/journey-context';
import { JourneyNav } from '../components/navigation/JourneyNav';
import { MainLayout } from './MainLayout';
import { JOURNEY_IDS } from '@austa/journey-context/src/constants';
import { LayoutProps } from '@austa/interfaces/components';
import { Box } from '@austa/design-system';

/**
 * Layout component for the Care Now journey ("Cuidar-me Agora").
 * Provides a consistent structure and styling for all screens within the Care journey.
 */
const CareLayout: React.FC<LayoutProps> = ({ children }) => {
  // Retrieves the current journey from the JourneyContext using the centralized hook
  const { journey, setJourney } = useJourney();

  // Checks if the current journey is the Care journey using standardized journey IDs
  const isCareJourney = journey?.id === JOURNEY_IDS.CARE;

  // Ensure the Care journey is set when this layout is used
  React.useEffect(() => {
    if (!isCareJourney) {
      setJourney(JOURNEY_IDS.CARE);
    }
  }, [isCareJourney, setJourney]);

  // Renders the main layout structure with the Care-specific styling and navigation
  return (
    <MainLayout>
      {/* Renders the JourneyNav component, which provides navigation between the main journeys */}
      <JourneyNav />

      {/* Wraps children in a Box with Care journey-specific styling */}
      <Box className="care-journey-content" data-testid="care-journey-content">
        {children}
      </Box>
    </MainLayout>
  );
};

export default CareLayout;
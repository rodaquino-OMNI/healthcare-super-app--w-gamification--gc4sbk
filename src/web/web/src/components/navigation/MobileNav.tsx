import React from 'react';
import { useRouter } from 'next/router';

import { ALL_JOURNEYS } from 'src/web/shared/constants/journeys.ts';
import { MOBILE_AUTH_ROUTES } from 'src/web/shared/constants/routes.ts';
import { Button } from '@austa/design-system/components/Button';
import { Icon } from '@design-system/primitives/components/Icon';
import { useJourney } from '@austa/journey-context/hooks/useJourney';
import { Box } from '@design-system/primitives/components/Box';
import { Stack } from '@design-system/primitives/components/Stack';

/**
 * MobileNav component provides a mobile-friendly navigation bar that adapts to the current journey,
 * displaying the appropriate color and icons. It implements the Journey Navigation System (F-105)
 * and Journey Color Coding (F-106) features.
 */
const MobileNav: React.FC = () => {
  const router = useRouter();
  const { journey, setJourney } = useJourney();
  
  // Handle journey navigation when a nav item is pressed
  const handleNavigateToJourney = (journeyId: string) => {
    setJourney(journeyId);
    
    // Navigate to the appropriate journey dashboard
    switch (journeyId) {
      case 'health':
        router.push('/health/dashboard');
        break;
      case 'care':
        router.push('/care/appointments');
        break;
      case 'plan':
        router.push('/plan');
        break;
      default:
        router.push('/');
    }
  };
  
  // Check if we're on an authentication page where the nav bar shouldn't be shown
  const isAuthRoute = Object.values(MOBILE_AUTH_ROUTES).some(
    route => router.pathname.includes(route)
  );
  
  // Don't show navigation on auth pages
  if (isAuthRoute) {
    return null;
  }

  return (
    <Box
      display="flex"
      justifyContent="space-around"
      alignItems="center"
      position="fixed"
      bottom={0}
      left={0}
      width="100%"
      height={80}
      backgroundColor="white"
      borderTopWidth={1}
      borderTopColor="#eee"
      borderTopStyle="solid"
      zIndex={100}
    >
      {ALL_JOURNEYS.map((journeyItem) => {
        const isActive = journey?.id === journeyItem.id;
        const journeyId = journeyItem.id as 'health' | 'care' | 'plan';
        
        return (
          <Stack
            key={journeyItem.id}
            direction="column"
            alignItems="center"
            justifyContent="center"
          >
            <Button
              variant="tertiary"
              size="md"
              journey={journeyId}
              icon={journeyItem.icon}
              onPress={() => handleNavigateToJourney(journeyItem.id)}
              accessibilityLabel={`Navigate to ${journeyItem.name} journey`}
            >
              {journeyItem.name}
            </Button>
          </Stack>
        );
      })}
    </Box>
  );
};

export default MobileNav;
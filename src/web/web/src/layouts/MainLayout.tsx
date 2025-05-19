import React from 'react';
import { useRouter } from 'next/router';

// Import primitives from @design-system/primitives instead of styled-components
import { Box } from '@design-system/primitives/src/components/Box';
import { Stack } from '@design-system/primitives/src/components/Stack';

// Import components from their respective paths
import { Sidebar } from 'src/web/web/src/components/navigation/Sidebar';
import { TopBar } from 'src/web/web/src/components/navigation/TopBar';
import { GamificationPopup } from 'src/web/web/src/components/shared/GamificationPopup';

// Import hooks from @austa/journey-context instead of local context
import { useJourney, useAuth, useGamification } from '@austa/journey-context/src/hooks';

// Import interfaces from @austa/interfaces
import { MainLayoutProps } from '@austa/interfaces/components/layout';
import { Achievement } from '@austa/interfaces/gamification/achievements';

/**
 * Main layout component that provides the structure for the application
 * Uses Box and Stack from @design-system/primitives for layout containers
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Retrieves the current journey from the JourneyContext
  const { currentJourney } = useJourney();
  // Retrieves the authentication status from the AuthContext
  const { isAuthenticated } = useAuth();
  // Retrieves the gamification state to check for unlocked achievements
  const { gameProfile } = useGamification();
  // Retrieves the router object from Next.js
  const router = useRouter();

  // Check if the user is authenticated, redirect to login if not
  if (!isAuthenticated) {
    // router.push('/auth/login');
    return null;
  }

  // Get the achievement ID from the game profile, if available
  const achievementId = gameProfile?.achievements.find((a: Achievement) => a.unlocked)?.id;

  // Renders the main layout structure with Sidebar and content area
  return (
    <Box 
      display="flex"
      minHeight="100vh"
      width="100%"
    >
      {/* Renders the mobile top bar, which is only visible on smaller screens */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        display={{ base: 'block', lg: 'none' }}
      >
        <TopBar />
      </Box>

      {/* Renders the sidebar, which is only visible on larger screens */}
      <Box
        width="280px"
        height="100vh"
        position="fixed"
        display={{ base: 'none', lg: 'block' }}
      >
        <Sidebar />
      </Box>

      {/* Renders the main content area */}
      <Box
        flex={1}
        marginLeft={{ base: 0, lg: '280px' }}
        padding={{ base: '16px', lg: '24px' }}
      >
        {/* Renders the children components (the content of the page) */}
        {children}
      </Box>

      {/* Renders the GamificationPopup when achievements are unlocked */}
      <GamificationPopup
        visible={!!achievementId}
        onClose={() => {
          // After closing the popup, refresh the page to update the achievement status
          router.replace(router.asPath);
        }}
        achievementId={achievementId || ''}
      />
    </Box>
  );
};
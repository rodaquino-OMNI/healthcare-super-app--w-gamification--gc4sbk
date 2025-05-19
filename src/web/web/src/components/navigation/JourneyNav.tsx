import React from 'react';
import { useRouter } from 'next/router';
import { JOURNEY_CONFIG, JOURNEY_IDS } from 'src/web/shared/constants/journeys';
import { Card } from '@austa/design-system/components/Card';
import { Text } from '@design-system/primitives/components/Text';
import { Icon } from '@design-system/primitives/components/Icon';
import { useJourney } from '@austa/journey-context/hooks/useJourney';

/**
 * A navigation component that displays the available journeys in the AUSTA SuperApp.
 * It uses the design system's Card component and applies journey-specific styling.
 * This component allows users to easily switch between different sections of the application.
 */
export const JourneyNav: React.FC = () => {
  const { journey, setJourney } = useJourney();
  const router = useRouter();

  return (
    <div>
      {Object.values(JOURNEY_CONFIG).map((journeyItem) => (
        <Card
          key={journeyItem.id}
          journey={journeyItem.id as 'health' | 'care' | 'plan'}
          elevation={journey?.id === journeyItem.id ? 'md' : 'sm'}
          interactive
          padding="md"
          margin="sm"
          onPress={() => {
            setJourney(journeyItem.id);
            
            // Navigate to the appropriate route based on journey
            switch (journeyItem.id) {
              case JOURNEY_IDS.HEALTH:
                router.push('/health/dashboard');
                break;
              case JOURNEY_IDS.CARE:
                router.push('/care/appointments');
                break;
              case JOURNEY_IDS.PLAN:
                router.push('/plan');
                break;
              default:
                router.push('/');
            }
          }}
          accessibilityLabel={`Navigate to ${journeyItem.name} journey`}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon 
              name={journeyItem.icon} 
              size="24px" 
              color={journeyItem.color}
              aria-hidden
            />
            <span style={{ marginLeft: '16px' }}>
              <Text 
                fontSize="lg"
                fontWeight="medium"
                color={journey?.id === journeyItem.id ? journeyItem.color : undefined}
              >
                {journeyItem.name}
              </Text>
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};
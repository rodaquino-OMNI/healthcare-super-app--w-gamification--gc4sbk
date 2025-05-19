import React from 'react';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Text } from '@austa/design-system';
import { DigitalCardData, PlanRouteParams } from '@austa/interfaces/plan';
import { usePlanJourney } from '@austa/journey-context';
import { getDigitalCard } from 'src/web/mobile/src/api/plan';
import { MOBILE_PLAN_ROUTES } from 'src/web/shared/constants/routes';

/**
 * Type definition for the navigation props.
 */
type DigitalCardScreenNavigationProp = StackNavigationProp<
  PlanRouteParams,
  'DigitalCard'
>;

/**
 * Type definition for the route props.
 */
type DigitalCardScreenRouteProp = RouteProp<PlanRouteParams, 'DigitalCard'>;

/**
 * Renders the Digital Insurance Card screen.
 *
 * @returns The rendered DigitalCardScreen component.
 */
export const DigitalCardScreen: React.FC = () => {
  // Retrieves the planId from the route parameters.
  const { params } = useRoute<DigitalCardScreenRouteProp>();
  const { planId } = params;

  // Uses the usePlanJourney hook to check if the user is authenticated and get journey context.
  const { isAuthenticated, journey } = usePlanJourney();

  // Uses the useNavigation hook to get the navigation object.
  const navigation = useNavigation<DigitalCardScreenNavigationProp>();

  // Uses useQuery hook to fetch the digital card data with proper error handling.
  const { data: cardData, isLoading, error } = useQuery<DigitalCardData, Error>({
    queryKey: ['digitalCard', planId],
    queryFn: () => getDigitalCard(planId),
    enabled: isAuthenticated && !!planId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (err) => {
      // Error is already handled by the useQuery hook and displayed in the UI
      console.error('Digital card fetch error:', err.message);
    }
  });

  // If not authenticated, navigate to the dashboard.
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate(MOBILE_PLAN_ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigation]);

  // Displays a loading indicator while fetching data.
  if (isLoading) {
    return (
      <Card journey={journey}>
        <Text>Loading digital card...</Text>
      </Card>
    );
  }

  // Displays an error message if there was an error fetching the data.
  if (error) {
    return (
      <Card journey={journey}>
        <Text>Unable to load your digital card</Text>
        <Text>Please try again later</Text>
        <Button 
          onPress={() => navigation.goBack()} 
          journey={journey}
        >
          Go Back
        </Button>
      </Card>
    );
  }

  // Renders the Card component with the digital card image and details.
  return (
    <Card journey={journey} accessibilityLabel="Digital Insurance Card">
      {cardData && (
        <>
          <Text>Digital Insurance Card</Text>
          <Text>Image URL: {cardData.cardImageUrl}</Text>
          <Text>Card Data: {JSON.stringify(cardData.cardData)}</Text>
          {/* Provides buttons for sharing and downloading the card. */}
          <Button onPress={() => {}} journey={journey}>
            Share Card
          </Button>
          <Button onPress={() => {}} journey={journey}>
            Download Card
          </Button>
        </>
      )}
    </Card>
  );
};
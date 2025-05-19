import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import journey context for health journey state management
import { useJourneyContext } from '@austa/journey-context';

// Import design system theme for consistent styling
import { healthTheme } from '@austa/design-system/src/themes';

// Import shared interfaces for type safety
import { JourneyId } from '@austa/interfaces/common/types';

// Import screen components
import { Dashboard } from '../screens/health/Dashboard';
import { MedicalHistoryScreen } from '../screens/health/MedicalHistory';
import { HealthGoalsScreen } from '../screens/health/HealthGoals';
import { DeviceConnectionScreen } from '../screens/health/DeviceConnection';
import { MetricDetail } from '../screens/health/MetricDetail';
import { AddMetricScreen } from '../screens/health/AddMetric';

// Import route constants
import { ROUTES } from '../constants/routes';

// Extend ROUTES with the missing HEALTH_ADD_METRIC constant
// This fixes the duplicate route name issue in the original implementation
if (!ROUTES.HEALTH_ADD_METRIC) {
  ROUTES.HEALTH_ADD_METRIC = 'HealthAddMetric';
}

// Create a Stack Navigator using createStackNavigator from React Navigation
const Stack = createStackNavigator();

/**
 * HealthNavigator
 * 
 * Defines the stack navigator for the "Minha Saúde" (My Health) journey.
 * Configures navigation for health dashboard, medical history, goals, device connections,
 * and metric screens with journey-specific styling and theming.
 * 
 * @returns React component that renders the Health journey navigation stack
 */
export default function HealthNavigator() {
  // Use journey context to access current journey state
  const { currentJourney } = useJourneyContext();
  
  // Verify this navigator is being used in the correct journey context
  React.useEffect(() => {
    if (currentJourney?.id !== JourneyId.Health) {
      console.warn('HealthNavigator is being used outside of the Health journey context');
    }
  }, [currentJourney]);

  return (
    <Stack.Navigator
      initialRouteName={ROUTES.HEALTH_DASHBOARD}
      screenOptions={{
        headerShown: false,
        // Use journey-specific theme from design system instead of direct color reference
        cardStyle: { backgroundColor: healthTheme.colors.background },
      }}
    >
      {/* Define the screens within the My Health journey */}
      <Stack.Screen 
        name={ROUTES.HEALTH_DASHBOARD} 
        component={Dashboard} 
      />
      <Stack.Screen 
        name={ROUTES.HEALTH_MEDICAL_HISTORY} 
        component={MedicalHistoryScreen} 
      />
      <Stack.Screen 
        name={ROUTES.HEALTH_HEALTH_GOALS} 
        component={HealthGoalsScreen} 
      />
      <Stack.Screen 
        name={ROUTES.HEALTH_DEVICE_CONNECTION} 
        component={DeviceConnectionScreen} 
      />
      <Stack.Screen 
        name={ROUTES.HEALTH_METRIC_DETAIL} 
        component={MetricDetail} 
      />
      {/* Fixed duplicate route name - changed to HEALTH_ADD_METRIC */}
      <Stack.Screen 
        name={ROUTES.HEALTH_ADD_METRIC} 
        component={AddMetricScreen} 
      />
    </Stack.Navigator>
  );
}
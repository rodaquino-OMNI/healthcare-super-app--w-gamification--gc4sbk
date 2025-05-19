import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import PlanDashboard from '../screens/plan/Dashboard';
import Coverage from '../screens/plan/Coverage';
import ClaimHistory from '../screens/plan/ClaimHistory';
import ClaimDetail from '../screens/plan/ClaimDetail';
import ClaimSubmission from '../screens/plan/ClaimSubmission';
import CostSimulator from '../screens/plan/CostSimulator';
import DigitalCard from '../screens/plan/DigitalCard';
import Benefits from '../screens/plan/Benefits';
import { routes } from '../constants/routes';
import { usePlanJourney } from '@austa/journey-context';
import { PlanTheme } from '@austa/design-system';

// Create a stack navigator instance using `createStackNavigator` from `@react-navigation/stack`
const Stack = createStackNavigator();

/**
 * A React component that defines the navigation stack for the 'My Plan & Benefits' journey.
 * Uses the Plan theme from the design system and integrates with journey-context for state management.
 */
const PlanNavigator: React.FC = () => {
  // Use the plan journey context for journey-specific state management
  const { journeyState } = usePlanJourney();

  // Define the screen options for the navigator, setting the header to be hidden
  // and applying the Plan theme colors
  const screenOptions = {
    headerShown: false,
    cardStyle: {
      backgroundColor: PlanTheme.colors.background,
    },
  };

  return (
    <Stack.Navigator initialRouteName={routes.PLAN_DASHBOARD} screenOptions={screenOptions}>
      {/* The main dashboard for the Plan journey */}
      <Stack.Screen name={routes.PLAN_DASHBOARD} component={PlanDashboard} />

      {/* Displays insurance coverage details */}
      <Stack.Screen name={routes.COVERAGE} component={Coverage} />

      {/* Displays the history of submitted claims */}
      <Stack.Screen name={routes.CLAIMS} component={ClaimHistory} />

      {/* Displays details of a specific claim */}
      <Stack.Screen name={routes.CLAIM_DETAIL} component={ClaimDetail} />

      {/* Allows users to submit new claims */}
      <Stack.Screen name={routes.CLAIM_SUBMISSION} component={ClaimSubmission} />

      {/* Simulates healthcare costs based on the user's plan */}
      <Stack.Screen name={routes.COST_SIMULATOR} component={CostSimulator} />

      {/* Displays the user's digital insurance card */}
      <Stack.Screen name={routes.DIGITAL_CARD} component={DigitalCard} />

      {/* Displays available benefits */}
      <Stack.Screen name={routes.BENEFITS} component={Benefits} />
    </Stack.Navigator>
  );
};

// Export the `PlanNavigator` component for use in the application
export { PlanNavigator };
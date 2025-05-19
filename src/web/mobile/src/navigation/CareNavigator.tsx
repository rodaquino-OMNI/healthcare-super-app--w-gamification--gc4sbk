import React from 'react'; // version 18.2.0
import { createStackNavigator } from '@react-navigation/stack'; // version 6.3.16
import { useJourney } from '@austa/journey-context'; // New package for journey-based state management

// Import screens from the care journey
import {
  Dashboard,
  AppointmentDetail,
  ProviderSearchScreen,
  SymptomChecker,
  Telemedicine,
  TreatmentPlanScreen,
  AppointmentBooking,
  MedicationTrackingScreen
} from '../screens/care';

// Import route constants
import { ROUTES } from '../constants/routes';

// Import journey constants for theming
import { JOURNEY_COLORS } from '../constants/journeys';

// Create a stack navigator
const Stack = createStackNavigator();

/**
 * CareNavigator component
 * 
 * Configures the navigation stack for the "Care Now" journey using React Navigation.
 * Implements journey-specific theming with the orange color scheme and provides
 * access to appointment management, provider search, symptom checking, and telemedicine features.
 * 
 * @returns React component that renders the Care journey navigation stack
 */
const CareNavigator: React.FC = () => {
  // Use journey context for journey-specific state management
  const { journey } = useJourney();

  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CARE_DASHBOARD}
      screenOptions={{
        headerShown: false, // Hide the default header
        cardStyle: { backgroundColor: JOURNEY_COLORS.CareNow }, // Apply journey-specific theming (orange)
      }}
    >
      {/* Dashboard - Main entry point for the Care journey */}
      <Stack.Screen 
        name={ROUTES.CARE_DASHBOARD} 
        component={Dashboard} 
      />

      {/* Appointment Detail - View details of a specific appointment */}
      <Stack.Screen 
        name={ROUTES.CARE_APPOINTMENTS} 
        component={AppointmentDetail} 
      />

      {/* Appointment Booking - Schedule a new appointment */}
      <Stack.Screen 
        name={ROUTES.CARE_APPOINTMENT_BOOKING} 
        component={AppointmentBooking} 
      />

      {/* Provider Search - Find healthcare providers */}
      <Stack.Screen 
        name="ProviderSearch" 
        component={ProviderSearchScreen} 
      />

      {/* Symptom Checker - Check symptoms and get recommendations */}
      <Stack.Screen 
        name={ROUTES.CARE_SYMPTOM_CHECKER} 
        component={SymptomChecker} 
      />

      {/* Telemedicine - Virtual healthcare consultations */}
      <Stack.Screen 
        name={ROUTES.CARE_TELEMEDICINE} 
        component={Telemedicine} 
      />

      {/* Treatment Plan - View and track treatment plans */}
      <Stack.Screen 
        name="TreatmentPlan" 
        component={TreatmentPlanScreen} 
      />

      {/* Medication Tracking - Track medications and adherence */}
      <Stack.Screen 
        name={ROUTES.CARE_MEDICATION_TRACKING} 
        component={MedicationTrackingScreen} 
      />
    </Stack.Navigator>
  );
};

// Export the CareNavigator component
export default CareNavigator;
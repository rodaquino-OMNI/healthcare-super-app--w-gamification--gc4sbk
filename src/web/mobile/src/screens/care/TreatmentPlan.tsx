import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TreatmentPlan } from '@austa/interfaces/care/treatment-plan';
import { MedicationList } from '../../components/lists/MedicationList';
import { JourneyHeader } from '../../components/shared/JourneyHeader';
import { useJourney } from '@austa/journey-context';
import { Card } from '@austa/design-system/components/Card';
import { Button } from '@austa/design-system/components/Button';
import { ProgressBar } from '@austa/design-system/components/ProgressBar';
import { LoadingIndicator } from '@austa/design-system/care/LoadingIndicator';
import { ErrorState } from '@austa/design-system/care/ErrorState';

// Define the route params interface for type safety
type TreatmentPlanRouteParams = {
  treatmentPlanId: string;
};

type TreatmentPlanScreenRouteProp = RouteProp<
  { TreatmentPlan: TreatmentPlanRouteParams },
  'TreatmentPlan'
>;

/**
 * Displays the details of a treatment plan and its associated medications.
 * This screen is part of the Care journey and shows treatment plan progress,
 * details, and associated medications.
 */
export const TreatmentPlanScreen: React.FC = () => {
  // Access the route parameters to get the treatment plan ID with proper typing
  const route = useRoute<TreatmentPlanScreenRouteProp>();
  const { treatmentPlanId } = route.params;
  
  // Get the current journey context for theming
  const { currentJourney } = useJourney();

  // Set up a state variable to store the treatment plan details
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);

  // Set up a state variable to track loading state
  const [loading, setLoading] = useState<boolean>(true);

  // Set up a state variable to track error state
  const [error, setError] = useState<string | null>(null);

  // Use useEffect to fetch the treatment plan details from the API when the component mounts
  useEffect(() => {
    const fetchTreatmentPlan = async () => {
      try {
        // Simulate API call
        // In a real implementation, this would be replaced with an actual API call
        // using a hook like useTreatmentPlan from a service layer
        setTimeout(() => {
          const mockTreatmentPlan: TreatmentPlan = {
            id: treatmentPlanId,
            name: 'Sample Treatment Plan',
            description: 'This is a sample treatment plan to manage your health.',
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            progress: 60,
            providerId: 'provider-123',
            providerName: 'Dr. Smith',
            medications: [
              {
                id: 'med-1',
                name: 'Medication 1',
                dosage: '10mg',
                frequency: 'Daily',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                instructions: 'Take with food',
              },
              {
                id: 'med-2',
                name: 'Medication 2',
                dosage: '5mg',
                frequency: 'Twice daily',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                instructions: 'Take after meals',
              },
            ],
          };
          setTreatmentPlan(mockTreatmentPlan);
          setLoading(false);
        }, 1000);
      } catch (e: any) {
        setError(e.message || 'Failed to load treatment plan');
        setLoading(false);
      }
    };

    fetchTreatmentPlan();
  }, [treatmentPlanId]);

  // If the treatment plan is loading, display a LoadingIndicator with care journey theming
  if (loading) {
    return <LoadingIndicator label="Loading treatment plan..." journey="care" />;
  }

  // If there is an error, display an ErrorState with care journey theming
  if (error) {
    return (
      <ErrorState 
        message={error} 
        journey="care" 
        onRetry={() => {
          setLoading(true);
          setError(null);
          // Re-fetch the treatment plan
          setTimeout(() => {
            // Simulate successful retry
            setLoading(false);
          }, 1000);
        }} 
      />
    );
  }

  // Otherwise, display the treatment plan details in a Card component
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <JourneyHeader title="Treatment Plan" showBackButton journey="care" />
      {treatmentPlan && (
        <Card style={{ margin: 16, padding: 16 }}>
          {/* Display the treatment plan name, description, start date, end date, and progress */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              {treatmentPlan.name}
            </Text>
            <Text style={{ marginBottom: 8 }}>
              {treatmentPlan.description}
            </Text>
            <Text style={{ marginBottom: 4 }}>
              Start Date: {treatmentPlan.startDate}
            </Text>
            <Text style={{ marginBottom: 8 }}>
              End Date: {treatmentPlan.endDate}
            </Text>
            <Text style={{ marginBottom: 4 }}>
              Provider: {treatmentPlan.providerName}
            </Text>
            
            {/* Progress section */}
            <View style={{ marginTop: 16, marginBottom: 16 }}>
              <Text style={{ marginBottom: 8 }}>Progress:</Text>
              {/* Use the ProgressBar component to visualize the treatment plan progress with care theming */}
              <ProgressBar 
                current={treatmentPlan.progress} 
                total={100} 
                journey="care" 
              />
              <Text style={{ marginTop: 4, textAlign: 'right' }}>
                {treatmentPlan.progress}%
              </Text>
            </View>
          </View>
          
          {/* Medications section */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              Medications
            </Text>
            {/* Display a MedicationList component to show the medications associated with the treatment plan */}
            <MedicationList medications={treatmentPlan.medications} />
          </View>
          
          {/* Action buttons */}
          <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button 
              title="Contact Provider" 
              onPress={() => {/* Handle contact provider */}} 
              journey="care" 
              variant="secondary"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button 
              title="Update Progress" 
              onPress={() => {/* Handle update progress */}} 
              journey="care"
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </Card>
      )}
    </View>
  );
};
import React, { useState } from 'react';
import { useRouter } from 'next/router';
// Import JourneyHeader component from design system
import { JourneyHeader } from '@austa/design-system/care';
// Import useJourney hook from journey-context package
import { useJourney } from '@austa/journey-context';
// Import UI primitives from primitives package
import { Button, Stack, Text } from '@design-system/primitives';
// Import SymptomSelector component from design system
import { SymptomSelector } from '@austa/design-system/care';
// Import shared components from design system
import { LoadingIndicator, EmptyState } from '@austa/design-system';
// Import symptom-related types from interfaces package
import { Symptom, SymptomCheckResult } from '@austa/interfaces/care';
// Import API functions from standardized location
import { checkSymptoms } from '@austa/shared/api/care';

/**
 * SymptomCheckerPage component for the Care journey
 * Allows users to select symptoms and receive preliminary guidance
 */
const SymptomCheckerPage: React.FC = () => {
  // Retrieve the Care journey context using the useJourney hook
  const { journey } = useJourney();
  // Initialize state variables for managing selected symptoms, loading state, and symptom check results
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SymptomCheckResult | null>(null);
  const router = useRouter();

  // Define a function to handle symptom selection, updating the selectedSymptoms state
  const handleSymptomsSelected = (symptoms: Symptom[]) => {
    setSelectedSymptoms(symptoms);
  };

  // Define a function to handle the symptom check submission, calling the checkSymptoms API and updating the results state
  const handleCheckSymptoms = async () => {
    setIsLoading(true);
    try {
      const symptomIds = selectedSymptoms.map((symptom) => symptom.id);
      const symptomCheckResults = await checkSymptoms({ symptoms: symptomIds });
      setResults(symptomCheckResults);
    } catch (error) {
      console.error('Error checking symptoms:', error);
      setResults({
        error: 'Failed to check symptoms. Please try again.',
        guidance: null,
        severity: null,
        recommendedAction: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock symptom data for demonstration purposes
  const symptoms: Symptom[] = [
    { id: '1', name: 'Fever' },
    { id: '2', name: 'Cough' },
    { id: '3', name: 'Headache' },
    { id: '4', name: 'Fatigue' },
    { id: '5', name: 'Sore Throat' },
    { id: '6', name: 'Runny Nose' },
    { id: '7', name: 'Muscle Aches' },
    { id: '8', name: 'Shortness of Breath' },
    { id: '9', name: 'Loss of Taste or Smell' },
    { id: '10', name: 'Nausea or Vomiting' },
  ];

  // If no symptoms are available, show an empty state
  if (symptoms.length === 0) {
    return (
      <div>
        <JourneyHeader title="Symptom Checker" showBackButton={true} />
        <EmptyState 
          title="No symptoms available" 
          description="Please try again later" 
          journey={journey}
        />
      </div>
    );
  }

  // Renders the UI with a JourneyHeader, SymptomSelector, and a button to check symptoms
  return (
    <div>
      <JourneyHeader title="Symptom Checker" showBackButton={true} />
      <Stack spacing="md" padding="md">
        {/* SymptomSelector component for selecting symptoms */}
        <SymptomSelector
          symptoms={symptoms}
          journey={journey}
          onSymptomsSelected={handleSymptomsSelected}
          selectedSymptoms={selectedSymptoms}
        />

        {/* Button to trigger the symptom check */}
        <Button
          onPress={handleCheckSymptoms}
          disabled={selectedSymptoms.length === 0 || isLoading}
          variant="primary"
          journey={journey}
        >
          Check Symptoms
        </Button>

        {/* Displays a loading indicator while the symptom check is in progress */}
        {isLoading && <LoadingIndicator label="Checking symptoms..." journey={journey} />}

        {/* Displays the symptom check results when available */}
        {results && results.error && (
          <Text color="semantic.error">{results.error}</Text>
        )}
        {results && !results.error && results.guidance && (
          <Stack spacing="sm">
            <Text fontSize="xl" fontWeight="bold">
              Preliminary Guidance:
            </Text>
            <Text>{results.guidance}</Text>
            
            {results.recommendedAction && (
              <>
                <Text fontSize="lg" fontWeight="bold" marginTop="md">
                  Recommended Action:
                </Text>
                <Text>{results.recommendedAction}</Text>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

// Set page configuration
SymptomCheckerPage.pageConfig = { unstable_runtimeJS: false };

// Export the SymptomCheckerPage component
export default SymptomCheckerPage;
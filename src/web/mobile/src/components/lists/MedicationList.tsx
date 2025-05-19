import React, { useState } from 'react';
import { Card } from '@austa/design-system';
import { EmptyState, LoadingIndicator } from '@austa/design-system';
import { formatDate } from '@austa/design-system/utils';
import { Box, Stack, Text } from '@design-system/primitives';
import { useJourneyContext } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';
import { Medication } from '@austa/interfaces/care';

/**
 * Displays a list of medications for a user, allowing them to track and manage their medication schedule.
 */
export const MedicationList: React.FC = () => {
  const { journey } = useJourneyContext();
  
  // Sample medication data - in a real implementation, this would come from an API
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Aspirin',
      dosage: '100mg',
      frequency: 'Once daily',
      startDate: '2023-04-01T00:00:00Z',
      endDate: '2023-10-01T00:00:00Z',
      notes: 'Take with food'
    },
    {
      id: '2',
      name: 'Vitamin D',
      dosage: '1000IU',
      frequency: 'Once daily',
      startDate: '2023-03-15T00:00:00Z',
      notes: 'Take with breakfast'
    },
    {
      id: '3',
      name: 'Atenolol',
      dosage: '50mg',
      frequency: 'Twice daily',
      startDate: '2023-02-10T00:00:00Z',
      endDate: '2023-08-10T00:00:00Z',
      notes: 'Take morning and evening'
    }
  ]);
  
  // Loading state - would be triggered during API calls
  const [isLoading, setIsLoading] = useState(false);

  // If medications are loading, display a LoadingIndicator
  if (isLoading) {
    return <LoadingIndicator journey={JOURNEY_IDS.CARE} label="Loading medications..." />;
  }

  // If there are no medications, display an EmptyState
  if (medications.length === 0) {
    return (
      <EmptyState
        icon="pill"
        title="No medications found"
        description="You don't have any medications added yet. Adding your medications helps us track your treatment plan and remind you when to take them."
        actionLabel="Add Medication"
        onAction={() => {/* Navigation logic would go here */}}
        journey={JOURNEY_IDS.CARE}
      />
    );
  }

  // If there are medications, map over the list and render a Card for each
  return (
    <Box paddingHorizontal="sm">
      {medications.map(medication => {
        const startDateFormatted = formatDate(new Date(medication.startDate), 'dd/MM/yyyy');
        const endDateFormatted = medication.endDate 
          ? formatDate(new Date(medication.endDate), 'dd/MM/yyyy') 
          : 'Ongoing';
        
        return (
          <Card
            key={medication.id}
            journey={JOURNEY_IDS.CARE}
            elevation="sm"
            margin="md"
            padding="md"
            interactive
            accessibilityLabel={`Medication: ${medication.name}, ${medication.dosage}, ${medication.frequency}`}
          >
            <Stack space="xs">
              <Text 
                variant="heading3" 
                color="text.primary"
                marginBottom="xs"
              >
                {medication.name}
              </Text>
              <Text 
                variant="body1"
                color="text.primary"
                marginBottom="xxs"
              >
                {medication.dosage}
              </Text>
              <Text 
                variant="body1"
                color="text.secondary"
                marginBottom="sm"
              >
                {medication.frequency}
              </Text>
              <Text 
                variant="body2"
                color="text.tertiary"
                marginBottom="xxs"
              >
                {startDateFormatted} - {endDateFormatted}
              </Text>
              {medication.notes && (
                <Text 
                  variant="body2"
                  color="text.tertiary"
                  fontStyle="italic"
                >
                  {medication.notes}
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Box>
  );
};
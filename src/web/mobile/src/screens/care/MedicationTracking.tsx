import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, EmptyState, LoadingIndicator, Button } from '@austa/design-system';
import { Box, Stack, Text, Icon } from '@design-system/primitives';
import { useJourneyContext } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';
import { Medication } from '@austa/interfaces/care';
import { formatDate } from '@austa/design-system/utils';
import { useNavigation } from '@react-navigation/native';

/**
 * MedicationTracking Screen
 * 
 * Displays and manages user medications with adherence tracking and reminder functionality.
 * Part of the Care journey in the AUSTA SuperApp.
 */
const MedicationTracking: React.FC = () => {
  const navigation = useNavigation();
  const { journey, journeyState } = useJourneyContext();
  
  // State for medications and loading status
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for tracking medication adherence
  const [adherenceData, setAdherenceData] = useState<Record<string, {
    taken: boolean;
    timestamp?: string;
  }[]>>({});

  // Fetch medications from API or context
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would fetch from an API
        // For now, we'll use sample data
        const sampleMedications: Medication[] = [
          {
            id: '1',
            name: 'Aspirin',
            dosage: '100mg',
            frequency: 'Once daily',
            startDate: '2023-04-01T00:00:00Z',
            endDate: '2023-10-01T00:00:00Z',
            notes: 'Take with food',
            reminderTime: '08:00',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          },
          {
            id: '2',
            name: 'Vitamin D',
            dosage: '1000IU',
            frequency: 'Once daily',
            startDate: '2023-03-15T00:00:00Z',
            notes: 'Take with breakfast',
            reminderTime: '08:30',
            daysOfWeek: ['monday', 'wednesday', 'friday']
          },
          {
            id: '3',
            name: 'Atenolol',
            dosage: '50mg',
            frequency: 'Twice daily',
            startDate: '2023-02-10T00:00:00Z',
            endDate: '2023-08-10T00:00:00Z',
            notes: 'Take morning and evening',
            reminderTime: '08:00,20:00',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setMedications(sampleMedications);
          setIsLoading(false);
        }, 1000);
        
        // Initialize adherence data
        const initialAdherenceData: Record<string, { taken: boolean; timestamp?: string }[]> = {};
        sampleMedications.forEach(med => {
          initialAdherenceData[med.id] = [];
          // Generate last 7 days of adherence data
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const taken = Math.random() > 0.3; // 70% chance of having taken the medication
            
            if (taken) {
              initialAdherenceData[med.id].push({
                taken,
                timestamp: date.toISOString()
              });
            } else {
              initialAdherenceData[med.id].push({
                taken
              });
            }
          }
        });
        setAdherenceData(initialAdherenceData);
        
      } catch (error) {
        console.error('Error fetching medications:', error);
        setIsLoading(false);
        // Show error state
        Alert.alert('Error', 'Failed to load medications. Please try again.');
      }
    };

    fetchMedications();
  }, []);

  // Handle marking medication as taken
  const handleMedicationTaken = (medicationId: string) => {
    setAdherenceData(prevData => {
      const updatedData = { ...prevData };
      const today = new Date().toISOString();
      
      // Add today's entry
      updatedData[medicationId] = [
        ...updatedData[medicationId],
        { taken: true, timestamp: today }
      ];
      
      return updatedData;
    });
    
    // Show confirmation
    Alert.alert('Success', 'Medication marked as taken!');
    
    // In a real app, this would sync with the backend
  };

  // Handle setting up a reminder
  const handleSetReminder = (medication: Medication) => {
    // In a real app, this would integrate with the device's notification system
    Alert.alert(
      'Set Reminder',
      `Reminder set for ${medication.name} at ${medication.reminderTime}`,
      [{ text: 'OK' }]
    );
  };

  // Navigate to add medication screen
  const handleAddMedication = () => {
    // In a real app, this would navigate to an add medication form
    Alert.alert('Add Medication', 'This would navigate to the add medication form.');
  };

  // Calculate adherence percentage for a medication
  const calculateAdherence = (medicationId: string): number => {
    const data = adherenceData[medicationId] || [];
    if (data.length === 0) return 0;
    
    const takenCount = data.filter(entry => entry.taken).length;
    return Math.round((takenCount / data.length) * 100);
  };

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
        onAction={handleAddMedication}
        journey={JOURNEY_IDS.CARE}
      />
    );
  }

  // Render the medication tracking screen
  return (
    <ScrollView style={styles.container}>
      <Box padding="md">
        <Stack space="md">
          <Text variant="heading2" color="text.primary">
            My Medications
          </Text>
          
          <Button 
            label="Add New Medication" 
            onPress={handleAddMedication}
            journey={JOURNEY_IDS.CARE}
            icon="plus"
            marginBottom="md"
          />
          
          {medications.map(medication => {
            const startDateFormatted = formatDate(new Date(medication.startDate), 'dd/MM/yyyy');
            const endDateFormatted = medication.endDate 
              ? formatDate(new Date(medication.endDate), 'dd/MM/yyyy') 
              : 'Ongoing';
            
            const adherencePercentage = calculateAdherence(medication.id);
            
            return (
              <Card
                key={medication.id}
                journey={JOURNEY_IDS.CARE}
                elevation="sm"
                margin="xs"
                padding="md"
                interactive
                accessibilityLabel={`Medication: ${medication.name}, ${medication.dosage}, ${medication.frequency}`}
              >
                <Stack space="md">
                  <Stack space="xs">
                    <Text 
                      variant="heading3" 
                      color="text.primary"
                    >
                      {medication.name}
                    </Text>
                    <Text 
                      variant="body1"
                      color="text.primary"
                    >
                      {medication.dosage}
                    </Text>
                    <Text 
                      variant="body1"
                      color="text.secondary"
                    >
                      {medication.frequency}
                    </Text>
                    <Text 
                      variant="body2"
                      color="text.tertiary"
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
                  
                  <Box 
                    backgroundColor="background.secondary"
                    padding="sm"
                    borderRadius="md"
                  >
                    <Stack space="sm">
                      <Text variant="heading4" color="text.primary">
                        Adherence Tracking
                      </Text>
                      
                      <Stack direction="row" alignItems="center" space="sm">
                        <Box 
                          width={`${adherencePercentage}%`} 
                          height={8} 
                          backgroundColor={adherencePercentage > 70 ? "success.main" : adherencePercentage > 40 ? "warning.main" : "error.main"}
                          borderRadius="full"
                        />
                        <Text variant="body2" color="text.secondary">
                          {adherencePercentage}%
                        </Text>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Button
                          label="Mark as Taken"
                          onPress={() => handleMedicationTaken(medication.id)}
                          journey={JOURNEY_IDS.CARE}
                          size="sm"
                          variant="secondary"
                        />
                        
                        <Button
                          label="Set Reminder"
                          onPress={() => handleSetReminder(medication)}
                          journey={JOURNEY_IDS.CARE}
                          size="sm"
                          variant="outline"
                          icon="bell"
                        />
                      </Stack>
                    </Stack>
                  </Box>
                  
                  {medication.reminderTime && (
                    <Stack direction="row" alignItems="center" space="xs">
                      <Icon name="bell" size="sm" color="care.main" />
                      <Text variant="body2" color="text.secondary">
                        Reminder: {medication.reminderTime.split(',').join(', ')}
                      </Text>
                    </Stack>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default MedicationTracking;